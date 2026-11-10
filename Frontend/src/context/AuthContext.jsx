import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

// Función auxiliar para aplanar el usuario si viene en formato GeoJSON Feature
const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  if (rawUser.type === 'Feature' && rawUser.properties) {
    return {
      ...rawUser.properties,
      id: rawUser.id || rawUser.properties.id,
      geometry: rawUser.geometry,
    };
  }
  return rawUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const perfilRaw = await authApi.getPerfil();
      const perfil = normalizeUser(perfilRaw);
      setUser(perfil);
      localStorage.setItem('usuario', JSON.stringify(perfil));
    } catch (err) {
      console.warn('No se pudo sincronizar perfil con backend:', err);
      // No cerrar la sesión si ya tenemos el perfil autenticado en localStorage (ej. Keycloak OIDC)
      const saved = localStorage.getItem('usuario');
      if (!saved) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [token]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    let rawPerfil = data.usuario || data.user;
    if (!rawPerfil) {
      rawPerfil = await authApi.getPerfil();
    }
    const perfil = normalizeUser(rawPerfil);
    setUser(perfil);
    localStorage.setItem('usuario', JSON.stringify(perfil));
    return perfil;
  };

  const loginWithKeycloakToken = (kcToken, kcUser) => {
    localStorage.setItem('access_token', kcToken);
    localStorage.setItem('usuario', JSON.stringify(kcUser));
    setToken(kcToken);
    setUser(kcUser);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUser(null);
  };

  const userRol = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userUsername = (user?.username || user?.properties?.username || '').toLowerCase();
  
  const isAdmin = Boolean(
    user && (
      userRol === 'ADMINISTRADOR' || 
      userRol === 'ADMIN' || 
      userUsername === 'admin' || 
      user?.is_staff || 
      user?.is_superuser
    )
  );

  const isGestor = Boolean(isAdmin || userRol === 'GESTOR');
  const isOperador = Boolean(isGestor || userRol === 'OPERADOR' || userRol === 'OPERADOR_COE');
  const isDigitalizador = Boolean(userRol === 'DIGITALIZADOR');
  const isInvitado = Boolean(!token || userRol === 'INVITADO' || userRol === 'CIUDADANO');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isGestor,
        isOperador,
        isDigitalizador,
        isInvitado,
        userRol,
        loading,
        login,
        loginWithKeycloakToken,
        logout,
        reloadProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

