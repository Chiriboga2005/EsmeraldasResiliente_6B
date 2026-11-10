# 🛡️ Guía Rápida de Activación: Servidor Keycloak en Docker (Cualquier PC)

Este documento detalla el procedimiento exacto para levantar el servidor de identidad **Keycloak** en cualquier computadora mañana usando Docker, garantizando persistencia total con **Aiven PostgreSQL**.

---

## 1. Requisitos Previos en la PC de Destino

1. Tener instalado y abierto **Docker Desktop** (asegúrate de que el icono en la barra de tareas esté en verde/activo).
2. Tener copiado o clonado este repositorio (`EsmeraldasResiliente_6B`).

---

## 2. Cómo Iniciar Keycloak (2 Métodos)

### Método A (Más Fácil - 1 Clic en Windows):
* Entra en la carpeta `docker` y haz doble clic sobre:
  ```text
  iniciar_keycloak.bat
  ```
  El script verificará Docker, descargará la imagen oficial de Keycloak (si es la primera vez), lo conectará a Aiven Cloud y abrirá automáticamente tu navegador en `http://localhost:8080`.

### Método B (Desde Terminal o PowerShell):
Abre una terminal en la carpeta `docker` y ejecuta:
```bash
docker compose up -d
```
Para ver los registros de arranque en tiempo real:
```bash
docker compose logs -f
```

---

## 3. Acceso a la Consola de Administración

* **URL Web:** [http://localhost:8080](http://localhost:8080)
* **Usuario Maestro:** `admin`
* **Contraseña:** `Esmeraldas2026*`

---

## 4. ¿Por qué NO se pierden los datos si cambias de PC?

> [!NOTE]
> Todo lo que configures en Keycloak (el Realm `esmeraldas-resiliente`, los clientes de React/Django/Móvil, los roles y los usuarios) **no se guarda en el disco duro de la PC local**.
> Se almacena de forma instantánea y encriptada en la base de datos de **Aiven PostgreSQL en la Nube**.
> 
> Por lo tanto:
> * Puedes apagar la PC hoy.
> * Encender otra PC mañana en otro lugar.
> * Ejecutar `docker compose up -d` y **todos tus usuarios y configuraciones estarán exactamente igual**.

---

## 5. Configuración del Realm y Usuarios para la Demo del Hackathon

Una vez dentro de la consola web:

### A. Crear Realm
* Menú superior izquierdo (debajo de "Keycloak") -> clic en **Master** -> **Create Realm**.
* **Realm name:** `esmeraldas-resiliente`
* Clic en **Create**.

### B. Crear Roles (Realm Roles)
En el menú izquierdo, ve a **Realm Roles** -> **Create Role**:
1. `GESTOR` *(Mando y Dirección COE)*
2. `OPERADOR` *(Consola de Situación y Despacho)*
3. `DIGITALIZADOR` *(Censo de campo móvil en zonas de riesgo)*
4. `INVITADO` *(Consulta ciudadana y reportes comunitarios)*

### C. Crear Clientes (Clients)
1. **Frontend Web (React):**
   * *Client ID:* `frontend-web`
   * *Client authentication:* `Off` (Público)
   * *Valid redirect URIs:* `http://localhost:5173/*` y `https://esmeraldasresiliente-6b.onrender.com/*`
   * *Web origins:* `*`
2. **Backend API (Django):**
   * *Client ID:* `backend-api`
   * *Client authentication:* `On`
3. **App Móvil (Flutter):**
   * *Client ID:* `mobile-app`
   * *Client authentication:* `Off`

### D. Crear los Usuarios Reales
En **Users** -> **Add user**:
* **Antonella Garcia Mendoza:**
  * *Username:* `antonella`
  * *Email:* `Antonella123@gmail.com`
  * *First Name:* `Antonella` | *Last Name:* `Garcia Mendoza`
  * Pestaña *Credentials*: Password `123antonella` -> Desactivar *Temporary*.
  * Pestaña *Role mapping*: Asignar rol `GESTOR`.
* **Axel Rosero Pulup:**
  * *Username:* `axel`
  * *Email:* `Axelrosero123@gmail.com`
  * *First Name:* `Axel` | *Last Name:* `Rosero Pulup`
  * Pestaña *Credentials*: Password `123Axel` -> Desactivar *Temporary*.
  * Pestaña *Role mapping*: Asignar rol `OPERADOR`.
* **Jomira Figueroa Chiriboga:**
  * *Username:* `jomira`
  * *Email:* `Jomira123@gmail.com`
  * *First Name:* `Jomira` | *Last Name:* `Figueroa Chiriboga`
  * Pestaña *Credentials*: Password `Jomira123` -> Desactivar *Temporary*.
  * Pestaña *Role mapping*: Asignar rol `DIGITALIZADOR`.

---

## 6. Resolución de Problemas (Troubleshooting)

### Conflicto de Puerto 8080:
Si en Docker Desktop tienes otro contenedor usando el puerto 8080 (por ejemplo `sgim-migracion`):
1. Detén el otro contenedor desde la interfaz de Docker Desktop haciendo clic en el botón de Stop (cuadrado).
2. O bien, cambia la línea de puertos en `docker-compose.yml` de `"8080:8080"` a `"8081:8080"`, e ingresas a [http://localhost:8081](http://localhost:8081).

### Cómo detener Keycloak:
Haz doble clic sobre `detener_keycloak.bat` o ejecuta:
```bash
docker compose down
```
