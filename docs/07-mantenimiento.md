# 🔄 H&M Servicios — Fase 7: Mantenimiento

> **Proyecto:** Plataforma Web H&M Servicios  
> **Fase:** Mantenimiento y Soporte Continuo  
> **Versión:** 1.0  
> **Fecha:** Mayo 2026

---

## 1. Tipos de Mantenimiento

### 1.1 Mantenimiento Correctivo
Corrección de errores (bugs) descubiertos en producción.

| Prioridad | Tiempo de Respuesta | Tiempo de Resolución | Ejemplo |
|-----------|--------------------|--------------------|---------|
| **Crítica** | < 1 hora | < 4 horas | Caída del servidor, fallo de pagos, vulnerabilidad de seguridad |
| **Alta** | < 4 horas | < 24 horas | Login no funciona, búsqueda de técnicos falla |
| **Media** | < 24 horas | < 72 horas | Error en cálculo de comisiones, dashboard muestra datos incorrectos |
| **Baja** | < 48 horas | < 1 semana | Error visual menor, tooltip incorrecto |

### 1.2 Mantenimiento Preventivo
Actividades programadas para evitar problemas futuros.

| Actividad | Frecuencia | Responsable |
|-----------|------------|-------------|
| Actualizar dependencias npm (seguridad) | Semanal | Desarrollador |
| Verificar espacio en disco y crecimiento de BD | Semanal | DevOps |
| Revisar logs de errores | Diario | DevOps |
| Ejecutar backup de base de datos | Diario (automático) | Cron job |
| Verificar certificado SSL (expiración) | Mensual | DevOps |
| Auditoría de seguridad | Trimestral | Equipo de seguridad |
| Revisar y limpiar sesiones/tokens expirados | Semanal | Automático |

### 1.3 Mantenimiento Adaptativo
Cambios requeridos por cambios en el entorno externo.

| Cambio Externo | Acción Requerida |
|---------------|------------------|
| Actualización de Node.js LTS | Actualizar runtime en el servidor |
| Cambio en API de pasarela de pagos | Actualizar módulo de pagos |
| Nueva normativa de gas natural | Actualizar catálogo de servicios y certificaciones |
| Cambio en regulación de datos (Habeas Data) | Revisar políticas de privacidad y manejo de datos personales |

### 1.4 Mantenimiento Perfectivo (Evolutivo)
Mejoras y nuevas funcionalidades planificadas.

| Mejora | Prioridad | Sprint Estimado |
|--------|-----------|-----------------|
| Integración real con pasarela de pagos (MercadoPago/Stripe) | Alta | Sprint 2 |
| Chat en tiempo real cliente-técnico (WebSocket) | Alta | Sprint 3 |
| Notificaciones push (PWA) | Media | Sprint 4 |
| App móvil nativa (React Native) | Media | Sprint 5-6 |
| Sistema de facturación electrónica (DIAN) | Alta | Sprint 3 |
| Mapa interactivo para seguimiento de técnicos | Media | Sprint 4 |
| Sistema de citas/calendario avanzado | Baja | Sprint 5 |
| Reportes exportables PDF/Excel | Media | Sprint 3 |
| Multi-idioma (Español/Inglés) | Baja | Sprint 6 |

---

## 2. Estrategia de Monitoreo Continuo

### 2.1 Monitoreo de Aplicación
```
┌─────────────────────────────────────────────────┐
│                 PM2 Ecosystem                    │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │  Uptime   │  │   CPU %   │  │  Memory MB   │ │
│  │  99.9%    │  │   12%     │  │   128 MB     │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Requests  │  │ Errors/h  │  │  Avg. Resp.  │ │
│  │  1,250/h  │  │    2      │  │   45ms       │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2.2 Alertas Automáticas
| Evento | Canal de Alerta | Acción |
|--------|-----------------|--------|
| Servidor caído (> 1 min) | Email + SMS | Reinicio automático PM2 + notificar DevOps |
| CPU > 80% por 5 min | Email | Investigar proceso |
| Memoria > 80% | Email | Reiniciar aplicación |
| Errores 5xx > 10/hora | Email | Revisar logs inmediatamente |
| Disco > 90% | Email + SMS | Limpiar logs antiguos y backups |
| Certificado SSL < 15 días | Email | Renovar con Certbot |

---

## 3. Plan de Backups y Recuperación

### 3.1 Política de Backups
| Tipo | Frecuencia | Retención | Ubicación |
|------|------------|-----------|-----------|
| **Completo** (BD + archivos) | Diario 2:00 AM | 30 días | Almacenamiento externo (AWS S3 o similar) |
| **Incremental** (solo BD) | Cada 6 horas | 7 días | Servidor local `/backups/` |
| **Snapshot del servidor** | Semanal | 4 snapshots | Proveedor de hosting |

### 3.2 Script de Backup Automático
```bash
#!/bin/bash
# backup.sh — Ejecutar con crontab
DATE=$(date +%Y%m%d_%H%M)
DB_PATH="/var/www/hm-servicios/data/hm_servicios.db"
BACKUP_DIR="/backups"

# Crear backup
cp "$DB_PATH" "$BACKUP_DIR/hm_servicios_$DATE.db"

# Comprimir
gzip "$BACKUP_DIR/hm_servicios_$DATE.db"

# Eliminar backups > 30 días
find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete

echo "[$DATE] Backup completado" >> /var/log/hm-backup.log
```

### 3.3 Procedimiento de Recuperación
1. Identificar el punto de fallo
2. Detener la aplicación: `pm2 stop hm-servicios`
3. Restaurar backup más reciente:
   ```bash
   gunzip /backups/hm_servicios_YYYYMMDD.db.gz
   cp /backups/hm_servicios_YYYYMMDD.db /var/www/hm-servicios/data/hm_servicios.db
   ```
4. Reiniciar: `pm2 restart hm-servicios`
5. Verificar integridad de datos
6. Documentar el incidente

---

## 4. Actualización de Dependencias

### 4.1 Proceso de Actualización
1. Revisar vulnerabilidades: `npm audit`
2. Actualizar parches de seguridad: `npm audit fix`
3. Verificar compatibilidad en entorno de desarrollo
4. Ejecutar suite de pruebas completa
5. Desplegar en staging/preview
6. Si todo está bien, desplegar en producción

### 4.2 Dependencias Críticas a Monitorear
| Paquete | Función | Riesgo si no se actualiza |
|---------|---------|--------------------------|
| `express` | Servidor web | Vulnerabilidades de seguridad HTTP |
| `better-sqlite3` | Base de datos | Corrupción de datos, fallos |
| `jsonwebtoken` | Autenticación | Bypass de autenticación |
| `bcryptjs` | Encriptación | Debilidad en hash de contraseñas |
| `helmet` | Headers de seguridad | Exposición a ataques |

---

## 5. Escalamiento del Proceso

### 5.1 Soporte de Primer Nivel
- Responde preguntas comunes de usuarios
- Escala problemas técnicos al segundo nivel
- Herramientas: Email de soporte, WhatsApp Business

### 5.2 Soporte de Segundo Nivel
- Diagnostica y resuelve bugs
- Gestiona base de datos (corrección de datos)
- Herramientas: Acceso a logs, PM2, SQLite

### 5.3 Soporte de Tercer Nivel
- Desarrollo de nuevas funcionalidades
- Cambios arquitecturales
- Migración de tecnología
- Herramientas: Acceso total al código fuente

---

## 6. Roadmap de Migración Tecnológica

A medida que la plataforma crezca, se recomienda la siguiente migración:

| Etapa | Trigger | Acción |
|-------|---------|--------|
| **Actual** | < 1000 usuarios | SQLite + Express en un solo servidor |
| **Etapa 2** | 1,000 - 10,000 usuarios | Migrar a PostgreSQL, agregar Redis para caché |
| **Etapa 3** | 10,000 - 50,000 usuarios | Contenedores Docker, Load Balancer, CI/CD |
| **Etapa 4** | > 50,000 usuarios | Microservicios, Kubernetes, CDN para estáticos |

### Migración SQLite → PostgreSQL
La migración es viable gracias a que:
- Todas las queries usan SQL estándar
- Los tipos de datos son compatibles
- El ORM layer se puede cambiar sin afectar controladores
- Solo se necesita cambiar `server/config/database.js`

---

## 7. Documentación de Cambios (Changelog)

### Formato
```markdown
## [Versión] - YYYY-MM-DD

### Agregado
- Nueva funcionalidad X

### Cambiado
- Mejora en el rendimiento de Y

### Corregido
- Bug en el cálculo de Z

### Seguridad
- Actualización de dependencia vulnerable W
```

### Ejemplo
```markdown
## [1.0.0] - 2026-05-28
### Agregado
- Sistema de registro y autenticación (JWT + bcrypt)
- Catálogo de servicios (gasodomésticos y obra civil)
- Búsqueda de técnicos por geolocalización (Haversine)
- Sistema de solicitudes de servicio con estados
- Procesamiento de pagos simulado con comisiones
- Panel de administración con estadísticas
- Dashboards personalizados por rol
- Diseño premium dark-theme con glassmorphism
- Documentación completa SDLC (7 fases)
```
