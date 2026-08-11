# 🧪 H&M Servicios — Fase 5: Pruebas

> **Proyecto:** Plataforma Web H&M Servicios  
> **Fase:** Pruebas y Aseguramiento de Calidad  
> **Versión:** 1.0  
> **Fecha:** Mayo 2026

---

## 1. Estrategia General de Pruebas

La fase de pruebas del proyecto H&M Servicios se enfoca en garantizar la funcionalidad, seguridad, rendimiento y usabilidad de la plataforma antes de su despliegue en producción.

### 1.1 Niveles de Prueba
| Nivel | Descripción | Herramientas |
|-------|-------------|--------------|
| **Unitarias** | Validar funciones individuales (controladores, utilidades) | Node.js assert, test runner propio |
| **Integración** | Verificar la interacción entre módulos (rutas → controladores → BD) | Fetch API contra servidor local |
| **Funcionales** | Validar casos de uso completos end-to-end | Prueba manual en navegador |
| **Seguridad** | Evaluar vulnerabilidades (OWASP Top 10) | Pruebas manuales de inyección, fuerza bruta |
| **Rendimiento** | Medir tiempos de respuesta y concurrencia | Pruebas de carga manuales |
| **Usabilidad** | Evaluar experiencia de usuario en distintos dispositivos | Revisión en Chrome, Firefox, Mobile |

---

## 2. Plan de Pruebas

### 2.1 Alcance
- Todas las rutas de la API REST (`/api/auth`, `/api/services`, `/api/technicians`, `/api/requests`, `/api/payments`, `/api/reviews`, `/api/admin`)
- Interfaz de usuario SPA (navegación, formularios, dashboards)
- Sistema de autenticación JWT
- Búsqueda por geolocalización
- Proceso de pago simulado
- Panel de administración

### 2.2 Criterios de Aceptación Global
- ✅ Todas las pruebas unitarias pasan sin errores
- ✅ Los flujos principales funcionan end-to-end
- ✅ No se encuentran vulnerabilidades críticas de seguridad
- ✅ Tiempo de respuesta de API < 500ms para el 95% de las solicitudes
- ✅ La interfaz es funcional en pantallas desde 375px hasta 1920px

---

## 3. Casos de Prueba

### CP-01: Registro de Cliente
| Campo | Valor |
|-------|-------|
| **Precondición** | No existe un usuario con el email indicado |
| **Entrada** | name: "Test Cliente", email: "test@test.com", password: "Test1234!", phone: "+573001112233", role: "client" |
| **Acción** | POST `/api/auth/register` |
| **Resultado esperado** | Status 201, retorna token JWT y datos del usuario |
| **Postcondición** | El usuario queda registrado en la tabla `users` |

### CP-02: Registro de Técnico con Perfil
| Campo | Valor |
|-------|-------|
| **Precondición** | No existe un usuario con el email indicado |
| **Entrada** | name: "Test Técnico", role: "technician", specialties: ["Gas", "Estufas"], description: "Técnico de prueba" |
| **Acción** | POST `/api/auth/register` |
| **Resultado esperado** | Status 201, se crea un registro en `users` y en `technician_profiles` |

### CP-03: Login Exitoso
| Campo | Valor |
|-------|-------|
| **Precondición** | El usuario existe y está activo |
| **Entrada** | email: "admin@hmservicios.com", password: "Admin123!" |
| **Acción** | POST `/api/auth/login` |
| **Resultado esperado** | Status 200, retorna token + refreshToken + datos del usuario con role "admin" |

### CP-04: Login con Credenciales Inválidas
| Campo | Valor |
|-------|-------|
| **Entrada** | email: "admin@hmservicios.com", password: "wrongpassword" |
| **Acción** | POST `/api/auth/login` |
| **Resultado esperado** | Status 401, mensaje "Invalid credentials" |

### CP-05: Acceso a Ruta Protegida sin Token
| Campo | Valor |
|-------|-------|
| **Acción** | GET `/api/auth/me` sin header Authorization |
| **Resultado esperado** | Status 401 ó 403, acceso denegado |

### CP-06: Listar Servicios
| Campo | Valor |
|-------|-------|
| **Acción** | GET `/api/services` |
| **Resultado esperado** | Status 200, retorna array de 8 servicios semilla (4 gasodomésticos + 4 obra civil) |

### CP-07: Filtrar Servicios por Categoría
| Campo | Valor |
|-------|-------|
| **Acción** | GET `/api/services?category=gasodomesticos` |
| **Resultado esperado** | Status 200, retorna solo servicios de categoría "gasodomesticos" |

### CP-08: Buscar Técnicos Cercanos
| Campo | Valor |
|-------|-------|
| **Entrada** | lat=4.6486, lng=-74.0628, radius=20 |
| **Acción** | GET `/api/technicians/nearby?lat=4.6486&lng=-74.0628&radius=20` |
| **Resultado esperado** | Status 200, retorna técnicos dentro de 20km de las coordenadas, ordenados por distancia |

### CP-09: Crear Solicitud de Servicio
| Campo | Valor |
|-------|-------|
| **Precondición** | Usuario autenticado como cliente |
| **Entrada** | technician_id: 2, service_id: 1, description: "Instalar calentador", scheduled_date: "2026-06-01" |
| **Acción** | POST `/api/requests` |
| **Resultado esperado** | Status 201, solicitud creada con status "pending" |

### CP-10: Técnico Acepta Solicitud
| Campo | Valor |
|-------|-------|
| **Precondición** | Solicitud en status "pending", autenticado como el técnico asignado |
| **Entrada** | status: "accepted", agreed_price: 200000 |
| **Acción** | PUT `/api/requests/:id/status` |
| **Resultado esperado** | Status 200, solicitud pasa a estado "accepted" |

### CP-11: Procesar Pago
| Campo | Valor |
|-------|-------|
| **Precondición** | Solicitud completada, autenticado como cliente |
| **Entrada** | service_request_id, amount: 200000, payment_method: "nequi" |
| **Acción** | POST `/api/payments` |
| **Resultado esperado** | Status 200, pago registrado, comisión empresa (15%) = 30000, pago técnico (85%) = 170000 |

### CP-12: Crear Reseña
| Campo | Valor |
|-------|-------|
| **Precondición** | Servicio pagado, autenticado como cliente |
| **Entrada** | service_request_id, rating: 5, comment: "Excelente servicio" |
| **Acción** | POST `/api/reviews` |
| **Resultado esperado** | Status 201, reseña creada, promedio del técnico actualizado |

### CP-13: Dashboard de Admin
| Campo | Valor |
|-------|-------|
| **Precondición** | Autenticado como admin |
| **Acción** | GET `/api/admin/dashboard` |
| **Resultado esperado** | Status 200, retorna totalUsers, activeTechs, totalRevenue |

### CP-14: Prevención de Registro Duplicado
| Campo | Valor |
|-------|-------|
| **Precondición** | Ya existe usuario con email "admin@hmservicios.com" |
| **Acción** | POST `/api/auth/register` con el mismo email |
| **Resultado esperado** | Status 400, mensaje "Email already registered" |

### CP-15: Cancelar Solicitud Pendiente
| Campo | Valor |
|-------|-------|
| **Precondición** | Solicitud en status "pending" |
| **Acción** | POST `/api/requests/:id/cancel` |
| **Resultado esperado** | Status 200, solicitud pasa a estado "cancelled" |

### CP-16: Prevención de Reseña Duplicada
| Campo | Valor |
|-------|-------|
| **Precondición** | Ya existe reseña para la solicitud |
| **Acción** | POST `/api/reviews` con el mismo service_request_id |
| **Resultado esperado** | Status 400, mensaje de error por restricción UNIQUE |

---

## 4. Matriz de Trazabilidad (Requisitos vs Pruebas)

| Requisito | CP-01 | CP-02 | CP-03 | CP-04 | CP-05 | CP-06 | CP-07 | CP-08 | CP-09 | CP-10 | CP-11 | CP-12 | CP-13 | CP-14 | CP-15 | CP-16 |
|-----------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| RF-01 Registro | ✅ | ✅ | | | | | | | | | | | | ✅ | | |
| RF-01 Login | | | ✅ | ✅ | ✅ | | | | | | | | | | | |
| RF-02 Catálogo | | | | | | ✅ | ✅ | | | | | | | | | |
| RF-03 Búsqueda | | | | | | | | ✅ | | | | | | | | |
| RF-04 Solicitud | | | | | | | | | ✅ | ✅ | | | | | ✅ | |
| RF-05 Pagos | | | | | | | | | | | ✅ | | | | | |
| RF-06 Admin | | | | | | | | | | | | | ✅ | | | |
| RF-07 Reseñas | | | | | | | | | | | | ✅ | | | | ✅ |

---

## 5. Pruebas de Seguridad (OWASP Top 10)

| Vulnerabilidad | Mitigación Implementada | Prueba |
|----------------|------------------------|--------|
| **A01 - Broken Access Control** | Middleware `verifyToken` + `requireRole` en todas las rutas protegidas | Intentar acceder a `/api/admin/dashboard` sin token y con token de cliente |
| **A02 - Cryptographic Failures** | Contraseñas hasheadas con bcrypt (10 salt rounds), JWT firmado con secreto seguro | Verificar que password_hash es irreversible |
| **A03 - Injection (SQL)** | Queries parametrizadas con `better-sqlite3` (nunca concatenación de strings) | Intentar inyección: `' OR 1=1 --` en campos de login |
| **A04 - Insecure Design** | Validación de entrada con `express-validator` | Enviar datos inválidos (email malo, rating > 5) |
| **A05 - Security Misconfiguration** | Helmet.js configura headers de seguridad automáticamente | Verificar headers X-Content-Type-Options, X-Frame-Options |
| **A07 - Auth Failures** | Rate limiting (5 intentos de login / 15min), JWT con expiración | Probar fuerza bruta con más de 5 intentos |
| **A08 - Data Integrity Failures** | Validación de tipos y rangos en cada endpoint | Enviar tipos de datos incorrectos |

---

## 6. Pruebas de Usabilidad

| Aspecto | Criterio | Verificación |
|---------|----------|-------------|
| **Navegación SPA** | El cambio de páginas es fluido sin recarga | Navegar entre #home, #services, #technicians, #login |
| **Responsividad** | La interfaz se adapta a móvil (375px), tablet (768px) y desktop (1200px+) | Redimensionar navegador o usar DevTools |
| **Formularios** | Los campos muestran feedback visual al enfocar y al error | Intentar enviar formularios vacíos |
| **Toasts** | Las notificaciones aparecen y desaparecen correctamente | Realizar acciones exitosas y erróneas |
| **Modales** | Se abren/cierran con animación, se cierra al hacer click afuera | Probar apertura de modal de pago |
| **Menú hamburguesa** | Funciona correctamente en pantallas < 768px | Probar en vista mobile |

---

## 7. Proceso de Reporte de Bugs

### Severidad
- **Crítica**: Impide el uso del sistema (crash, pérdida de datos, vulnerabilidad de seguridad)
- **Alta**: Funcionalidad principal no funciona pero hay workaround
- **Media**: Problema visual o funcional menor
- **Baja**: Mejora cosmética o de rendimiento

### Formato de Reporte
```
ID: BUG-XXX
Título: [Descripción breve]
Severidad: [Crítica | Alta | Media | Baja]
Pasos para reproducir:
  1. ...
  2. ...
Resultado actual: ...
Resultado esperado: ...
Evidencia: [Captura de pantalla o log]
```
