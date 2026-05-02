# Sistema de Invitaciones de Administradores

Este documento describe cómo funciona el sistema de invitaciones y registro de administradores.

## Descripción General

Solo el superadmin (ROL_ID = 1) puede enviar invitaciones a nuevos administradores. El flujo es el siguiente:

1. **Superadmin envía invitación** → Se crea un registro con estado `pending` y se envía un email con token
2. **Usuario registrado recibe email** → Accede al link de invitación con el token
3. **Usuario completa el registro** → Registra su contraseña y recibe un código de verificación
4. **Usuario verifica su email** → Usa el código enviado para verificar su email
5. **Superadmin aprueba/rechaza** → El superadmin aprueba o rechaza la solicitud del nuevo administrador

## Rutas API

### 1. Enviar Invitación
**Endpoint:** `POST /admin/auth/invitation/send`
**Autenticación:** Requerida (JWT Token en header)
**Rol requerido:** Superadmin (ROL_ID = 1)

**Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "nombre": "Nombre Completo",
  "rolId": 2
}
```

**Response (201):**
```json
{
  "ok": true,
  "message": "Invitación enviada correctamente"
}
```

---

### 2. Registrarse desde Invitación
**Endpoint:** `POST /admin/auth/register`
**Autenticación:** No requerida
**Rol requerido:** Ninguno

**Body:**
```json
{
  "token": "token_de_invitacion_de_64_caracteres",
  "password": "MiPassword123"
}
```

**Response (201):**
```json
{
  "ok": true,
  "message": "Registro completado. Verifica tu correo."
}
```

**Validaciones de contraseña:**
- Mínimo 6 caracteres, máximo 128
- Al menos una letra
- Al menos un número

---

### 3. Verificar Email
**Endpoint:** `POST /admin/auth/verify-email`
**Autenticación:** No requerida
**Rol requerido:** Ninguno

**Body:**
```json
{
  "email": "nuevo@ejemplo.com",
  "codigo": "123456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Correo verificado correctamente"
}
```

---

### 4. Aprobar Administrador
**Endpoint:** `POST /admin/auth/approve/:adminId`
**Autenticación:** Requerida (JWT Token en header)
**Rol requerido:** Superadmin (ROL_ID = 1)

**Body:**
```json
{
  "motivo": "Aprobado por verificación de datos"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Administrador aprobado correctamente"
}
```

**Precondiciones:**
- El administrador debe haber verificado su email
- Si tiene estado `pending`, debe haber registrado su contraseña

---

### 5. Rechazar Administrador
**Endpoint:** `POST /admin/auth/reject/:adminId`
**Autenticación:** Requerida (JWT Token en header)
**Rol requerido:** Superadmin (ROL_ID = 1)

**Body:**
```json
{
  "motivo": "No cumple con los requisitos"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Administrador rechazado"
}
```

---

### 6. Listar Administradores
**Endpoint:** `GET /admin/auth/list`
**Autenticación:** Requerida (JWT Token en header)
**Rol requerido:** Superadmin (ROL_ID = 1)

**Query Parameters:**
- `page` (opcional, default: 1): Número de página (1-1000)
- `limit` (opcional, default: 10): Items por página (1-100)
- `nombre` (opcional): Buscar por nombre (parcial)
- `email` (opcional): Buscar por email (parcial)
- `rol_id` (opcional): Filtrar por rol (1, 2, o 3)
- `status` (opcional): Filtrar por estado (pending, approved, rejected)

**Example:**
```
GET /admin/auth/list?page=1&limit=10&status=pending&rol_id=2
```

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "admins": [
      {
        "NUM_ADMIN": 1,
        "NOMBRE": "Juan Pérez",
        "EMAIL": "juan@ejemplo.com",
        "ROL_ID": 2,
        "STATUS": "pending",
        "FEC_ALTA": "20260416",
        "EMAIL_VERIFICADO": false,
        "PASSWORD_REGISTRADO": true
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## Estados de Administrador

- **pending**: Invitación enviada, esperando que el usuario registre su contraseña
- **approved**: Administrador aprobado por el superadmin, puede iniciar sesión
- **rejected**: Administrador rechazado por el superadmin

## Campos de Auditoría

Los siguientes campos se registran automáticamente para auditoría:

### Al crear (invitación):
- `FEC_ALTA`: Fecha de creación (YYYYMMDD)
- `HORA_ALTA`: Hora de creación (HHMMSS)
- `CVE_USUARIO_ALTA`: ID del usuario que creó
- `DES_IP_ALTA`: IP del usuario que creó

### Al aprobar/rechazar:
- `FEC_REACTIVA`/`FEC_BAJA`: Fecha de aprobación/rechazo
- `HORA_REACTIVA`/`HORA_BAJA`: Hora de aprobación/rechazo
- `CVE_USUARIO_REACTIVA`/`CVE_USUARIO_BAJA`: ID del usuario que aprobó/rechazó
- `DES_IP_REACTIVA`/`DES_IP_BAJA`: IP del usuario que aprobó/rechazó
- `DES_MOTIVO_REACTIVA`/`DES_MOTIVO_BAJA`: Motivo de la decisión

## Validaciones de Seguridad

- Todos los inputs se sanitizan para evitar XSS
- Las contraseñas se hashean con bcryptjs
- Los tokens son únicos y de 64 caracteres
- Las invitaciones expiran después de 24 horas
- Los códigos de verificación expiran después de 15 minutos
- Solo el superadmin puede enviar invitaciones, aprobar y rechazar administradores

## Flujo Completo de Ejemplo

### Cliente Frontend

```javascript
// 1. Usuario hace clic en link de invitación con token en URL
// URL: http://localhost:5173/admin/register?token=...

// 2. Completar el registro
const registerResponse = await fetch('/admin/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: tokenFromUrl,
    password: 'MiPassword123'
  })
});

// 3. Verificar email
const verifyResponse = await fetch('/admin/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nuevo@ejemplo.com',
    codigo: '123456' // Código recibido por email
  })
});

// 4. Esperaraprobación del superadmin...

// 5. Una vez aprobado, puede iniciar sesión
const loginResponse = await fetch('/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nuevo@ejemplo.com',
    password: 'MiPassword123'
  })
});
```

### Superadmin

```javascript
// 1. Enviar invitación
const inviteResponse = await fetch('/admin/auth/invitation/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    email: 'nuevo@ejemplo.com',
    nombre: 'Juan Pérez',
    rolId: 2
  })
});

// 2. Listar administradores pendientes
const listResponse = await fetch('/admin/auth/list?status=pending', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. Aprobar
const approveResponse = await fetch('/admin/auth/approve/1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    motivo: 'Aprobado tras verificación'
  })
});
```

## Manejo de Errores

Todos los errores retornan status HTTP apropiado:

- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: Token inválido/expirado
- **403 Forbidden**: Permiso denegado (no es superadmin)
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

**Formato de error:**
```json
{
  "ok": false,
  "message": "Descripción del error"
}
```
