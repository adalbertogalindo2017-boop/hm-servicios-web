# 💻 H&M Servicios — Fase de Programación

| Campo           | Detalle                                      |
|-----------------|----------------------------------------------|
| **Proyecto**    | Plataforma de Gestión — H&M Servicios        |
| **Fase**        | 04 — Programación                            |
| **Versión**     | 1.0                                          |
| **Fecha**       | 26 de mayo de 2026                           |
| **Autor**       | Equipo de Desarrollo H&M Servicios           |
| **Estado**      | Aprobado                                     |

---

## 1. Introducción

Este documento detalla los estándares de codificación, la configuración del entorno de desarrollo, la descripción de módulos, la arquitectura del código, la estrategia de control de versiones y las dependencias del proyecto **Plataforma de Gestión para H&M Servicios**.

---

## 2. Estándares y Convenciones de Codificación

### 2.1 Convenciones Generales

| Aspecto                   | Convención                                                   |
|---------------------------|--------------------------------------------------------------|
| Idioma del código         | Inglés para código, español para comentarios de negocio.     |
| Indentación               | 2 espacios (sin tabulaciones).                               |
| Longitud máxima de línea  | 100 caracteres.                                              |
| Punto y coma              | Obligatorio en JavaScript/TypeScript.                        |
| Comillas                  | Comillas simples (`'`) para strings, backticks para templates.|
| Fin de archivo            | Línea vacía al final de cada archivo.                        |
| Formato de archivos       | UTF-8, LF (Unix line endings).                               |

### 2.2 Convenciones de Nomenclatura

| Elemento                  | Convención       | Ejemplo                              |
|---------------------------|------------------|--------------------------------------|
| Variables                 | camelCase        | `clienteNombre`, `ordenEstado`       |
| Constantes                | UPPER_SNAKE_CASE | `MAX_LOGIN_ATTEMPTS`, `JWT_SECRET`   |
| Funciones                 | camelCase        | `getClientById()`, `createOrder()`   |
| Clases                    | PascalCase       | `OrderService`, `ClientController`   |
| Archivos de módulo        | kebab-case       | `order-service.js`, `client-routes.js`|
| Componentes React         | PascalCase       | `OrderList.jsx`, `ClientForm.jsx`    |
| Tablas de BD              | snake_case       | `ordenes_trabajo`, `movimientos_inventario` |
| Columnas de BD            | snake_case       | `fecha_programada`, `tipo_documento` |
| Endpoints API             | kebab-case       | `/v1/ordenes-trabajo`, `/v1/clientes`|
| Variables de entorno       | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET`         |

### 2.3 Estructura de Archivos y Carpetas

```
hm-servicios/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/                  # Imágenes, fuentes, íconos
│   │   ├── components/              # Componentes reutilizables
│   │   │   ├── common/              # Botones, inputs, modals
│   │   │   ├── layout/              # Header, Sidebar, Footer
│   │   │   └── ui/                  # Cards, Tables, Charts
│   │   ├── hooks/                   # Custom hooks
│   │   ├── pages/                   # Páginas/vistas principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients/
│   │   │   ├── Orders/
│   │   │   ├── Billing/
│   │   │   ├── Inventory/
│   │   │   ├── Reports/
│   │   │   ├── Schedule/
│   │   │   ├── Settings/
│   │   │   └── Portal/
│   │   ├── services/                # Llamadas a la API
│   │   ├── store/                   # Estado global (Zustand/Redux)
│   │   ├── utils/                   # Funciones utilitarias
│   │   ├── constants/               # Constantes de la app
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Backend Node.js
│   ├── src/
│   │   ├── config/                  # Configuración de la app
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   ├── mailer.js
│   │   │   └── environment.js
│   │   ├── controllers/             # Controladores de rutas
│   │   │   ├── auth.controller.js
│   │   │   ├── client.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── service.controller.js
│   │   │   ├── invoice.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   ├── report.controller.js
│   │   │   └── user.controller.js
│   │   ├── middlewares/             # Middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── rate-limiter.middleware.js
│   │   │   ├── error-handler.middleware.js
│   │   │   └── audit.middleware.js
│   │   ├── models/                  # Modelos Prisma
│   │   │   └── schema.prisma
│   │   ├── routes/                  # Definición de rutas
│   │   │   ├── auth.routes.js
│   │   │   ├── client.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── service.routes.js
│   │   │   ├── invoice.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   ├── report.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── index.js
│   │   ├── services/                # Lógica de negocio
│   │   │   ├── auth.service.js
│   │   │   ├── client.service.js
│   │   │   ├── order.service.js
│   │   │   ├── invoice.service.js
│   │   │   ├── inventory.service.js
│   │   │   ├── report.service.js
│   │   │   ├── notification.service.js
│   │   │   └── pdf.service.js
│   │   ├── validators/              # Esquemas de validación
│   │   │   ├── auth.validator.js
│   │   │   ├── client.validator.js
│   │   │   ├── order.validator.js
│   │   │   └── invoice.validator.js
│   │   ├── utils/                   # Utilidades
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   └── logger.js
│   │   └── app.js                   # Punto de entrada
│   ├── tests/                       # Pruebas automatizadas
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── .env.example
│   └── package.json
│
├── docs/                            # Documentación del proyecto
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### 2.4 Reglas de ESLint y Prettier

```json
// .eslintrc.json
{
  "env": {
    "node": true,
    "es2024": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:node/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "max-len": ["warn", { "code": 100 }],
    "no-multiple-empty-lines": ["error", { "max": 1 }]
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "lf"
}
```

### 2.5 Convenciones de Comentarios

```javascript
/**
 * Crea una nueva orden de trabajo en el sistema.
 *
 * @param {Object} orderData - Datos de la orden de trabajo.
 * @param {number} orderData.clienteId - ID del cliente.
 * @param {number} orderData.tecnicoId - ID del técnico asignado.
 * @param {Array<Object>} orderData.servicios - Servicios incluidos en la orden.
 * @returns {Promise<Object>} La orden de trabajo creada.
 * @throws {ValidationError} Si los datos no son válidos.
 * @throws {NotFoundError} Si el cliente o técnico no existen.
 */
async function createOrder(orderData) {
  // Validar que el cliente exista
  const cliente = await clientRepository.findById(orderData.clienteId);
  if (!cliente) {
    throw new NotFoundError('Cliente no encontrado');
  }

  // Generar número consecutivo de orden (formato: OT-YYYY-NNNN)
  const numero = await generateOrderNumber();

  // ...
}
```

---

## 3. Configuración del Entorno de Desarrollo

### 3.1 Prerrequisitos

| Software              | Versión Mínima | Propósito                                |
|-----------------------|----------------|------------------------------------------|
| Node.js               | 20.x LTS       | Runtime del backend                      |
| npm                   | 10.x           | Gestor de paquetes                       |
| PostgreSQL            | 16.x           | Base de datos principal                  |
| Redis                 | 7.x            | Caché y sesiones                         |
| Git                   | 2.40+          | Control de versiones                     |
| Docker                | 24.x           | Contenedorización (opcional en dev)      |
| VS Code               | Latest         | IDE recomendado                          |

### 3.2 Extensiones Recomendadas de VS Code

| Extensión                       | Propósito                                   |
|---------------------------------|---------------------------------------------|
| ESLint                          | Análisis estático de código                 |
| Prettier                        | Formateo automático                         |
| Prisma                          | Soporte para schema Prisma                  |
| ES7+ React/Redux Snippets      | Snippets para React                         |
| Tailwind CSS IntelliSense       | Autocompletado de clases Tailwind           |
| GitLens                         | Historial de Git avanzado                   |
| Thunder Client / REST Client    | Pruebas de API                              |
| Docker                          | Gestión de contenedores                     |

### 3.3 Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/hmservicios/plataforma-gestion.git
cd plataforma-gestion

# 2. Instalar dependencias del backend
cd server
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales locales

# 4. Iniciar servicios con Docker Compose (PostgreSQL + Redis)
docker-compose up -d postgres redis

# 5. Ejecutar migraciones de base de datos
npx prisma migrate dev

# 6. Poblar datos semilla
npx prisma db seed

# 7. Iniciar el servidor de desarrollo
npm run dev

# 8. Instalar dependencias del frontend
cd ../client
npm install

# 9. Iniciar el cliente de desarrollo
npm run dev
```

### 3.4 Variables de Entorno

```bash
# .env.example

# ─── Base de Datos ─────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/hm_servicios
DB_POOL_MIN=2
DB_POOL_MAX=10

# ─── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── JWT ───────────────────────────────────────────────
JWT_SECRET=tu_clave_secreta_aqui_min_32_chars
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# ─── Servidor ─────────────────────────────────────────
PORT=3000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=http://localhost:5173

# ─── Email (SMTP) ─────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@hmservicios.com
SMTP_PASS=tu_contraseña_smtp

# ─── AWS S3 ───────────────────────────────────────────
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=hm-servicios-files
AWS_REGION=us-east-1

# ─── Logging ──────────────────────────────────────────
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# ─── Rate Limiting ────────────────────────────────────
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 4. Descripción de Módulos

### 4.1 Diagrama de Módulos

```mermaid
graph TB
    subgraph "Módulos de la Aplicación"
        AUTH["🔐 Módulo de Autenticación<br/>Login, registro, JWT, roles"]
        CLI["👤 Módulo de Clientes<br/>CRUD, búsqueda, historial"]
        ORD["📋 Módulo de Órdenes<br/>Crear, asignar, seguimiento"]
        SRV["🔧 Módulo de Servicios<br/>Catálogo, precios, categorías"]
        FAC["💰 Módulo de Facturación<br/>Cotizaciones, facturas, pagos"]
        INV["📦 Módulo de Inventario<br/>Stock, kardex, alertas"]
        AGD["📅 Módulo de Agenda<br/>Calendario, disponibilidad"]
        RPT["📈 Módulo de Reportes<br/>Dashboard, KPIs, exportación"]
        NTF["📧 Módulo de Notificaciones<br/>Email, alertas internas"]
        PTL["🌐 Portal del Cliente<br/>Consultas, solicitudes"]
    end

    AUTH --> CLI
    AUTH --> ORD
    CLI --> ORD
    SRV --> ORD
    ORD --> FAC
    ORD --> INV
    ORD --> AGD
    ORD --> NTF
    FAC --> RPT
    ORD --> RPT
    CLI --> PTL
    ORD --> PTL
    FAC --> PTL
```

### 4.2 Detalle por Módulo

#### Módulo de Autenticación (`auth`)

| Componente            | Archivo                       | Responsabilidad                                      |
|-----------------------|-------------------------------|------------------------------------------------------|
| Controlador           | auth.controller.js            | Manejar requests de login, registro, refresh, logout.|
| Servicio              | auth.service.js               | Lógica de autenticación, generación/validación JWT.  |
| Middleware            | auth.middleware.js            | Verificar token en requests protegidas.              |
| Validador             | auth.validator.js             | Validar formato de email, contraseña, etc.           |
| Rutas                 | auth.routes.js                | Definir endpoints: POST /login, POST /refresh, etc.  |

**Funcionalidades clave:**
- Login con email y contraseña.
- Generación de JWT con claims de usuario (id, email, rol).
- Refresh token para renovar sesión sin re-login.
- Bloqueo temporal tras 5 intentos fallidos.
- Middleware de autorización basado en roles (RBAC).

#### Módulo de Órdenes de Trabajo (`orders`)

| Componente            | Archivo                       | Responsabilidad                                      |
|-----------------------|-------------------------------|------------------------------------------------------|
| Controlador           | order.controller.js           | Manejar CRUD de órdenes y cambios de estado.         |
| Servicio              | order.service.js              | Lógica de negocio: creación, validación, transiciones.|
| Validador             | order.validator.js            | Validar datos de entrada para órdenes.               |
| Rutas                 | order.routes.js               | Definir endpoints de órdenes.                        |

**Funcionalidades clave:**
- Generación automática de número consecutivo (OT-YYYY-NNNN).
- Máquina de estados para transiciones válidas.
- Asignación de técnicos con verificación de disponibilidad.
- Cálculo automático de precios según servicios seleccionados.
- Registro de historial de cambios de estado con timestamps.
- Asociación de materiales de inventario consumidos.

#### Módulo de Facturación (`invoicing`)

**Funcionalidades clave:**
- Generación de cotizaciones con validez configurable (30 días por defecto).
- Conversión de cotización aprobada a orden de trabajo.
- Generación de facturas con cálculo automático de IVA (19 %).
- Aplicación de descuentos autorizados (máximo 15 %).
- Exportación de facturas y cotizaciones en PDF.
- Registro de pagos con método de pago.
- Envío automático de factura al correo del cliente.

#### Módulo de Inventario (`inventory`)

**Funcionalidades clave:**
- Registro de productos con código, nombre, categoría, stock y precio.
- Movimientos de entrada (compras) y salida (uso en órdenes).
- Kardex detallado con trazabilidad por producto.
- Alertas automáticas cuando el stock cae bajo el mínimo configurado.
- Asociación de materiales consumidos a órdenes de trabajo.

---

## 5. Arquitectura del Código

### 5.1 Flujo de una Petición HTTP

```mermaid
sequenceDiagram
    participant C as Cliente (Browser)
    participant R as Router
    participant MW as Middlewares
    participant CT as Controller
    participant SV as Service
    participant RP as Repository
    participant DB as PostgreSQL

    C->>R: HTTP Request (POST /v1/ordenes)
    R->>MW: rate-limiter → auth → validation
    MW->>MW: Verificar JWT token
    MW->>MW: Verificar permisos de rol
    MW->>MW: Validar body con esquema Joi/Zod
    MW->>CT: Request validada
    CT->>SV: createOrder(orderData)
    SV->>SV: Aplicar lógica de negocio
    SV->>RP: clientRepository.findById(id)
    RP->>DB: SELECT * FROM clientes WHERE id = $1
    DB-->>RP: Resultado
    RP-->>SV: Cliente encontrado
    SV->>RP: orderRepository.create(data)
    RP->>DB: INSERT INTO ordenes_trabajo (...)
    DB-->>RP: Orden creada
    RP-->>SV: Orden con ID
    SV->>SV: Enviar notificación al técnico
    SV-->>CT: Orden creada exitosamente
    CT-->>C: HTTP 201 { success: true, data: {...} }
```

### 5.2 Manejo de Errores

```javascript
// Jerarquía de errores personalizados
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} no encontrado(a)`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

**Formato de respuesta de error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos.",
    "details": [
      {
        "field": "email",
        "message": "El formato del correo electrónico no es válido."
      },
      {
        "field": "telefono",
        "message": "El teléfono debe tener 10 dígitos."
      }
    ]
  }
}
```

---

## 6. Estrategia de Control de Versiones

### 6.1 Modelo de Ramificación (Git Flow Simplificado)

```mermaid
gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "setup proyecto"

    branch feature/auth
    checkout feature/auth
    commit id: "login endpoint"
    commit id: "JWT middleware"
    checkout develop
    merge feature/auth id: "merge auth"

    branch feature/clients
    checkout feature/clients
    commit id: "CRUD clientes"
    commit id: "búsqueda clientes"
    checkout develop
    merge feature/clients id: "merge clients"

    branch feature/orders
    checkout feature/orders
    commit id: "crear orden"
    commit id: "estados orden"
    checkout develop
    merge feature/orders id: "merge orders"

    checkout main
    merge develop id: "release v1.0" tag: "v1.0.0"

    checkout develop
    branch hotfix/fix-login
    checkout hotfix/fix-login
    commit id: "fix login bug"
    checkout main
    merge hotfix/fix-login id: "hotfix" tag: "v1.0.1"
    checkout develop
    merge hotfix/fix-login
```

### 6.2 Ramas del Repositorio

| Rama                    | Propósito                                              | Protección                |
|-------------------------|--------------------------------------------------------|---------------------------|
| `main`                  | Código en producción, siempre estable.                 | PR obligatorio + 2 reviews |
| `develop`               | Integración de features, base para nuevos desarrollos. | PR obligatorio + 1 review  |
| `feature/<nombre>`      | Desarrollo de una funcionalidad específica.            | Ninguna                    |
| `bugfix/<nombre>`       | Corrección de errores no críticos.                     | Ninguna                    |
| `hotfix/<nombre>`       | Corrección urgente en producción.                      | PR obligatorio + 1 review  |
| `release/<versión>`     | Preparación de una nueva versión para producción.      | PR obligatorio + 1 review  |

### 6.3 Convención de Commits (Conventional Commits)

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[pie de página opcional]
```

| Tipo       | Uso                                        | Ejemplo                                             |
|------------|--------------------------------------------|----------------------------------------------------|
| `feat`     | Nueva funcionalidad                        | `feat(orders): agregar creación de órdenes`        |
| `fix`      | Corrección de error                        | `fix(auth): corregir validación de JWT expirado`   |
| `docs`     | Documentación                              | `docs(readme): actualizar instrucciones de setup`  |
| `style`    | Formato (no afecta lógica)                 | `style(client): formatear con prettier`            |
| `refactor` | Refactorización sin cambio funcional       | `refactor(orders): extraer service layer`          |
| `test`     | Agregar o modificar pruebas               | `test(auth): agregar tests para login`             |
| `chore`    | Tareas de mantenimiento                    | `chore(deps): actualizar dependencias`             |
| `perf`     | Mejora de rendimiento                      | `perf(db): optimizar consulta de órdenes`          |

### 6.4 Flujo de Code Review

1. El desarrollador crea un **Pull Request** (PR) de su rama feature hacia `develop`.
2. El PR debe incluir: descripción del cambio, capturas (si aplica), referencia al ticket.
3. Al menos **1 revisor** debe aprobar el PR.
4. Todas las **pruebas automatizadas** deben pasar (CI pipeline).
5. No debe haber **conflictos** con la rama destino.
6. El revisor verifica: lógica, seguridad, rendimiento, estándares de código, cobertura de tests.

---

## 7. Dependencias del Proyecto

### 7.1 Dependencias del Backend

| Paquete               | Versión  | Propósito                                              | Justificación                                       |
|-----------------------|----------|--------------------------------------------------------|-----------------------------------------------------|
| express               | ^4.18    | Framework web HTTP                                     | Maduro, minimalista, amplio ecosistema middleware.   |
| @prisma/client        | ^5.x     | ORM para PostgreSQL                                    | Type-safety, migraciones automáticas, rendimiento.   |
| jsonwebtoken          | ^9.0     | Generación y verificación de tokens JWT                | Estándar de la industria para autenticación stateless.|
| bcryptjs              | ^2.4     | Hash de contraseñas                                    | Seguro, resistente a ataques de fuerza bruta.        |
| joi                   | ^17.x    | Validación de esquemas de datos                        | Declarativo, mensajes de error claros.               |
| nodemailer            | ^6.9     | Envío de correos electrónicos                          | Compatible con SMTP, templates HTML.                 |
| pdfkit                | ^0.14    | Generación de documentos PDF                           | Facturas y cotizaciones en PDF.                      |
| exceljs               | ^4.4     | Generación de archivos Excel                           | Exportación de reportes.                             |
| winston               | ^3.11    | Logging estructurado                                   | Niveles, transports, formato JSON.                   |
| helmet                | ^7.1     | Headers de seguridad HTTP                              | Protección contra ataques comunes.                   |
| cors                  | ^2.8     | Control de origen cruzado                              | Permitir requests del frontend.                      |
| express-rate-limit    | ^7.1     | Rate limiting                                          | Prevención de abuso de la API.                       |
| dotenv                | ^16.3    | Variables de entorno                                   | Configuración segura por entorno.                    |
| multer                | ^1.4     | Upload de archivos                                     | Evidencia fotográfica de técnicos.                   |
| ioredis               | ^5.3     | Cliente Redis                                          | Caché, sesiones, rate limiting.                      |
| uuid                  | ^9.0     | Generación de identificadores únicos                   | IDs de referencia para facturas/cotizaciones.        |
| dayjs                 | ^1.11    | Manipulación de fechas                                 | Ligero, inmutable, compatible con locales.           |

### 7.2 Dependencias del Frontend

| Paquete                   | Versión  | Propósito                                          | Justificación                                      |
|---------------------------|----------|----------------------------------------------------|----------------------------------------------------|
| react                     | ^18.2    | Librería UI                                        | Ecosistema maduro, rendimiento, comunidad.         |
| react-dom                 | ^18.2    | Renderizado DOM                                    | Complemento obligatorio de React.                  |
| react-router-dom          | ^6.x     | Enrutamiento SPA                                   | Navegación declarativa, lazy loading.              |
| axios                     | ^1.6     | Cliente HTTP                                       | Interceptores, cancelación, manejo de errores.     |
| zustand                   | ^4.5     | Estado global                                      | Ligero, simple, sin boilerplate.                   |
| tailwindcss               | ^3.4     | Framework CSS utility-first                        | Rápido, responsive, consistente.                   |
| @headlessui/react         | ^1.7     | Componentes UI accesibles                          | Modals, dropdowns, sin estilos impuestos.          |
| @heroicons/react          | ^2.0     | Iconos SVG                                         | Consistentes con Tailwind.                         |
| react-hook-form           | ^7.x     | Gestión de formularios                             | Rendimiento, validación, mínimos re-renders.       |
| recharts                  | ^2.10    | Gráficos y visualización                           | Declarativo, responsive, integrado con React.      |
| react-big-calendar        | ^1.8     | Calendario interactivo                             | Agenda de técnicos, vistas día/semana/mes.         |
| react-hot-toast           | ^2.4     | Notificaciones toast                               | Ligero, personalizable, accesible.                 |
| date-fns                  | ^3.x     | Utilidades de fecha                                | Tree-shakeable, inmutable.                         |

### 7.3 Dependencias de Desarrollo

| Paquete               | Propósito                                  |
|-----------------------|--------------------------------------------|
| jest                  | Framework de pruebas                       |
| supertest             | Pruebas de endpoints HTTP                  |
| eslint                | Linting de código JavaScript               |
| prettier              | Formateo automático de código              |
| nodemon               | Recarga automática en desarrollo           |
| prisma                | CLI de migraciones y generación            |
| husky                 | Git hooks (pre-commit, pre-push)           |
| lint-staged           | Ejecutar linters solo en archivos staged   |
| @testing-library/react| Pruebas de componentes React               |
| vite                  | Bundler y dev server del frontend          |

---

## 8. Pipeline de Integración Continua (CI)

```mermaid
graph LR
    A["🔄 Push / PR"] --> B["📥 Checkout código"]
    B --> C["📦 Instalar dependencias"]
    C --> D["🔍 Lint (ESLint)"]
    D --> E["🧪 Pruebas unitarias"]
    E --> F["🧪 Pruebas de integración"]
    F --> G["📊 Reporte de cobertura"]
    G --> H{"¿Cobertura ≥ 80%?"}
    H -->|Sí| I["✅ Pipeline exitoso"]
    H -->|No| J["❌ Pipeline fallido"]
    I --> K["🏗️ Build de producción"]
    K --> L["📦 Docker image"]
```

```yaml
# .github/workflows/ci.yml (resumen)
name: CI Pipeline
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

---

> **Documento controlado** — Cualquier modificación debe ser aprobada por el comité de cambios del proyecto.
