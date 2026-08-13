# 🚀 H&M Servicios — Fase 6: Despliegue

> **Proyecto:** Plataforma Web H&M Servicios  
> **Fase:** Despliegue y Puesta en Producción  
> **Versión:** 1.0  
> **Fecha:** Mayo 2026

---

## 1. Requisitos del Servidor

### 1.1 Hardware Mínimo
| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB | 2 GB |
| **Disco** | 10 GB SSD | 20 GB SSD |
| **Red** | 100 Mbps | 1 Gbps |

### 1.2 Software
| Componente | Versión |
|------------|---------|
| **Sistema Operativo** | Ubuntu 22.04 LTS / Windows Server 2022 |
| **Node.js** | v18.x LTS o superior |
| **npm** | v9.x o superior |
| **PM2** | v5.x (gestor de procesos para producción) |
| **Nginx** | v1.24+ (proxy inverso, opcional pero recomendado) |
| **Git** | v2.x |

---

## 2. Variables de Entorno

El archivo `.env` debe configurarse en el servidor de producción con los siguientes valores:

```env
# Servidor
PORT=3000
NODE_ENV=production

# Base de Datos
DB_PATH=./data/hm_servicios.db

# JWT
JWT_SECRET=clave-secreta-produccion-cambiar-por-una-segura
JWT_REFRESH_SECRET=clave-refresh-produccion-cambiar-por-una-segura
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Comisión
COMMISSION_RATE=0.15

# CORS
CORS_ORIGINS=https://hmservicios.com,https://www.hmservicios.com

# Logs
LOG_LEVEL=warn
```

> ⚠️ **IMPORTANTE**: Las claves JWT deben ser cadenas aleatorias largas (mínimo 64 caracteres). Nunca usar las de ejemplo.

---

## 3. Checklist de Despliegue

### Pre-Despliegue
- [ ] Todas las pruebas unitarias pasan (`npm test`)
- [ ] No hay errores de consola en el frontend
- [ ] Variables de entorno configuradas correctamente
- [ ] Claves JWT generadas de forma segura
- [ ] Base de datos respaldada (si es actualización)
- [ ] Código revisado y aprobado por el equipo

### Despliegue
- [ ] Código subido al servidor (git pull o transfer)
- [ ] Dependencias instaladas (`npm install --production`)
- [ ] Base de datos inicializada correctamente
- [ ] Servidor arrancado con PM2
- [ ] Proxy inverso Nginx configurado (si aplica)
- [ ] HTTPS habilitado (certificado SSL)
- [ ] Firewall configurado (solo puertos 80, 443, 22)

### Post-Despliegue
- [ ] Verificar acceso a la URL pública
- [ ] Probar login con usuario admin
- [ ] Probar flujo completo: registro → búsqueda → solicitud
- [ ] Verificar que los logs se están generando
- [ ] Monitorear errores durante las primeras 24 horas

---

## 4. Guía Paso a Paso

### 4.1 Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx (opcional)
sudo apt install -y nginx
```

### 4.2 Desplegar la Aplicación

```bash
# Clonar o copiar el proyecto
cd /var/www
git clone <URL_REPO> hm-servicios
cd hm-servicios

# Instalar solo dependencias de producción
npm install --production

# Crear archivo .env de producción
cp .env.example .env
nano .env   # Editar con valores de producción

# Iniciar con PM2
pm2 start server/server.js --name "hm-servicios" --env production

# Guardar configuración de PM2 para reinicio automático
pm2 save
pm2 startup
```

### 4.3 Configurar Nginx como Proxy Inverso

```nginx
# /etc/nginx/sites-available/hmservicios
server {
    listen 80;
    server_name hmservicios.com www.hmservicios.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Caché de archivos estáticos
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/hmservicios /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4 Habilitar HTTPS con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d hmservicios.com -d www.hmservicios.com
```

---

## 5. Comandos de Operación

| Acción | Comando |
|--------|---------|
| Ver estado del servidor | `pm2 status` |
| Ver logs en tiempo real | `pm2 logs hm-servicios` |
| Reiniciar servidor | `pm2 restart hm-servicios` |
| Detener servidor | `pm2 stop hm-servicios` |
| Monitorear CPU/RAM | `pm2 monit` |
| Recargar sin downtime | `pm2 reload hm-servicios` |

---

## 6. Plan de Rollback

En caso de fallo crítico durante o después del despliegue:

### Pasos Inmediatos
1. **Detener** la versión problemática: `pm2 stop hm-servicios`
2. **Restaurar** la versión anterior del código:
   ```bash
   git log --oneline -5          # Identificar el commit anterior
   git checkout <commit_hash>    # Volver al commit estable
   ```
3. **Restaurar** la base de datos desde backup:
   ```bash
   cp /backups/hm_servicios_<fecha>.db ./data/hm_servicios.db
   ```
4. **Reiniciar**: `pm2 restart hm-servicios`
5. **Verificar** que el sistema funciona correctamente
6. **Notificar** al equipo y documentar el incidente

### Backups Automáticos
```bash
# Agregar al crontab para backup diario a las 2AM
0 2 * * * cp /var/www/hm-servicios/data/hm_servicios.db /backups/hm_servicios_$(date +\%Y\%m\%d).db
```

---

## 7. Monitoreo Post-Despliegue

### Métricas a Monitorear
| Métrica | Herramienta | Umbral de Alerta |
|---------|-------------|------------------|
| **Uptime** | PM2 / UptimeRobot | < 99.5% |
| **CPU del proceso** | PM2 monit | > 80% sostenido |
| **Memoria del proceso** | PM2 monit | > 500MB |
| **Tiempo de respuesta API** | Logs de Express | > 1 segundo |
| **Errores HTTP 5xx** | Logs de Nginx | > 5 por hora |
| **Espacio en disco** | `df -h` | < 20% libre |

### Dashboard de Monitoreo
```bash
# Ver métricas en tiempo real
pm2 monit

# Ver logs filtrados por errores
pm2 logs hm-servicios --err

# Ver métricas de la última hora
pm2 show hm-servicios
```
