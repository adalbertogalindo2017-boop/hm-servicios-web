# H&M Servicios - Plataforma de Gasodomésticos y Obra Civil

Esta es la aplicación web completa para la empresa H&M, que permite conectar clientes con técnicos especializados para mantenimientos de gasodomésticos y servicios de obra civil.

## Características
- **Backend Completo**: Desarrollado en Node.js con Express y Better-SQLite3.
- **Frontend SPA**: Desarrollado usando Vanilla JavaScript (HTML, CSS y JS sin frameworks pesados), logrando un diseño moderno tipo "Glassmorphism" con transiciones suaves.
- **Autenticación**: JWT (JSON Web Tokens) con roles diferenciados (Cliente, Técnico, Administrador).
- **Geolocalización**: Los clientes pueden encontrar los técnicos más cercanos utilizando la fórmula de Haversine.
- **Base de Datos Pre-Poblada**: Al arrancar el servidor por primera vez, se generarán usuarios de prueba, técnicos, servicios, solicitudes de prueba y valoraciones.
- **Seguridad**: Implementación de Helmet, Cors, y limitador de velocidad (Rate Limit).

## Instrucciones de Instalación y Configuración

1. Asegúrate de tener Node.js instalado (v18 o superior).
2. Abre la consola en el directorio raíz del proyecto (`proyecto H&M SENA`).
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Organiza y copia los activos y mockups del proyecto:
   ```bash
   npm run setup
   ```
5. Inicia el servidor (en modo desarrollo):
   ```bash
   npm run dev
   ```
6. Abre el navegador en [http://localhost:3000](http://localhost:3000).

## Usuarios de Prueba Generados Automáticamente

| Rol | Correo Electrónico | Contraseña |
| --- | --- | --- |
| Administrador | admin@hmservicios.com | Admin123! |
| Técnico (Gas) | carlos.martinez@email.com | Tecnico123! |
| Técnico (Obra Civil) | maria.rodriguez@email.com | Tecnico123! |
| Cliente | ana.morales@email.com | Cliente123! |

## Documentación
Toda la documentación técnica requerida, incluyendo planificación, análisis, diseño, programación, pruebas, despliegue y mantenimiento, se encuentra en la carpeta `docs/`.

---
*Desarrollado con ❤️ para el proyecto SENA.*
