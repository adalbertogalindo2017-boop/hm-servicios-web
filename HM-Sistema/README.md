# ⚠️ Este panel NO está conectado a la aplicación real

Esta carpeta (`HM-Sistema/`) es un **prototipo histórico** de panel de
administración hecho en HTML/CSS/JS suelto (sin framework, sin backend
propio). Se usó como maqueta/diseño en una etapa temprana del proyecto,
pero **no está servido por la aplicación Express real** ni se despliega
en producción — no tiene ninguna ruta en `server/server.js` ni en
`vercel.json` que apunte aquí.

## ¿Dónde está el panel de administración real?

El panel de administración que sí funciona, con datos reales, está
dentro de la aplicación principal:

- Código: `public/js/dashboard.js` (función `renderAdminDashboard` /
  `loadAdminDashboard`), cargado dentro del SPA de `public/index.html`.
- Se accede navegando a `#admin-dashboard` dentro del sitio desplegado,
  iniciando sesión con una cuenta de rol `admin`.
- Consume la API real bajo `/api/admin/*` (ver `server/routes/admin.routes.js`).

## ¿Por qué sigue aquí entonces?

Se deja como referencia histórica/de diseño (puede ser útil para la
documentación del proyecto en `docs/03-diseno.md`), pero **no debe
editarse esperando que afecte el sitio real**, y no debería usarse como
punto de partida para agregar funcionalidad nueva — cualquier cambio al
panel de administración real va en `public/js/dashboard.js` y sus rutas
correspondientes en `server/routes/admin.routes.js` /
`server/controllers/admin.controller.js`.

Si en algún momento se decide que esta carpeta ya no aporta valor, se
puede eliminar del repositorio sin afectar el funcionamiento del sitio.
