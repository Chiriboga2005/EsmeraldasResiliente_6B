import logging
import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from apps.authentication.models import Usuario, RolUsuario

logger = logging.getLogger(__name__)

class KeycloakOrJWTAuthentication(authentication.BaseAuthentication):
    """
    Autenticación híbrida Enterprise para Hackathon:
    1. Si la petición incluye un token emitido por Keycloak (RS256), valida la firma
       contra el endpoint público de certificados (JWKS) del Realm de Keycloak y sincroniza el rol.
    2. Si el token es un JWT interno de Django (HS256) o si Keycloak no está configurado,
       permite que el siguiente backend (JWTAuthentication) lo procese sin lanzar error.
    """
    _jwks_client = None

    @classmethod
    def get_jwks_client(cls):
        keycloak_url = getattr(settings, 'KEYCLOAK_URL', '')
        realm = getattr(settings, 'KEYCLOAK_REALM', 'esmeraldas-resiliente')
        if not keycloak_url:
            return None
        if cls._jwks_client is None:
            jwks_url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/certs"
            try:
                cls._jwks_client = jwt.PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
            except Exception as e:
                logger.warning(f"No se pudo inicializar cliente JWKS de Keycloak ({jwks_url}): {e}")
                return None
        return cls._jwks_client

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1].strip()
        if not token:
            return None

        keycloak_url = getattr(settings, 'KEYCLOAK_URL', '')
        realm = getattr(settings, 'KEYCLOAK_REALM', 'esmeraldas-resiliente')

        # Si Keycloak está configurado, intentar validarlo como token OIDC de Keycloak
        if keycloak_url:
            try:
                # Decodificar cabecera no verificada para revisar algoritmo
                unverified_headers = jwt.get_unverified_header(token)
                alg = unverified_headers.get('alg', '')

                # Los tokens de Keycloak se firman típicamente con RS256
                if alg in ('RS256', 'RS384', 'RS512'):
                    client = self.get_jwks_client()
                    if client:
                        signing_key = client.get_signing_key_from_jwt(token)
                        payload = jwt.decode(
                            token,
                            signing_key.key,
                            algorithms=[alg],
                            options={"verify_aud": False}
                        )
                        return self._sync_keycloak_user(payload, token)
            except Exception as e:
                logger.info(f"Token no procesado por Keycloak ({e}); delegando a SimpleJWT.")

        # Si no es token de Keycloak o falló la verificación RS256, delegar al JWT interno
        return None

    def _sync_keycloak_user(self, payload, token):
        """
        Extrae los claims de Keycloak y obtiene o sincroniza el Usuario en Django.
        """
        username = payload.get('preferred_username') or payload.get('sub') or 'keycloak_user'
        email = payload.get('email')
        first_name = payload.get('given_name') or ''
        last_name = payload.get('family_name') or ''

        # Extraer roles del Realm de Keycloak
        realm_access = payload.get('realm_access', {})
        kc_roles = [r.upper() for r in realm_access.get('roles', [])]

        rol = RolUsuario.INVITADO
        is_staff = False
        is_superuser = False

        if 'ADMINISTRADOR' in kc_roles or 'ADMIN' in kc_roles or 'GESTOR' in kc_roles:
            rol = RolUsuario.GESTOR
            is_staff = True
            if 'ADMINISTRADOR' in kc_roles or 'ADMIN' in kc_roles:
                is_superuser = True
        elif 'OPERADOR' in kc_roles or 'OPERADOR_COE' in kc_roles:
            rol = RolUsuario.OPERADOR
            is_staff = True
        elif 'DIGITALIZADOR' in kc_roles or 'CENSADOR' in kc_roles:
            rol = RolUsuario.DIGITALIZADOR
        elif 'CIUDADANO' in kc_roles:
            rol = RolUsuario.CIUDADANO

        user = None
        if email:
            user = Usuario.objects.filter(email__iexact=email).first()
        if not user and username:
            user = Usuario.objects.filter(username__iexact=username).first()

        if user:
            # Sincronizar rol si cambió en Keycloak
            if user.rol != rol:
                user.rol = rol
                user.is_staff = is_staff
                if is_superuser:
                    user.is_superuser = True
                user.save(update_fields=['rol', 'is_staff', 'is_superuser'])
        else:
            # Crear usuario aprovisionado por Keycloak (Just-In-Time Provisioning)
            telefono_dummy = '09' + ''.join([str(ord(c) % 10) for c in (username or '00000000')[:8]]).ljust(8, '0')
            user = Usuario.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                telefono=telefono_dummy,
                rol=rol,
                is_staff=is_staff,
                is_superuser=is_superuser,
                is_active=True
            )

        return (user, token)

