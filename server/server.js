const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (ahora asíncrono: @libsql/client habla por red/archivo
// de forma no bloqueante). Guardamos la promesa y la esperamos antes de
// atender cualquier request — tanto en un server local de toda la vida
// como en una función serverless de Vercel (donde esta misma promesa ya
// resuelta se reutiliza en invocaciones posteriores del mismo contenedor "tibio").
let dbReadyPromise = initializeDatabase();
dbReadyPromise.catch((err) => {
    console.error('❌ Error inicializando la base de datos:', err);
});

app.use((req, res, next) => {
    dbReadyPromise
        .then(() => next())
        .catch((err) => {
            // Si la inicialización falló (p. ej. un corte de red transitorio
            // al conectar con Turso durante un cold start), no dejamos esta
            // misma promesa ya rechazada "envenenando" todas las peticiones
            // futuras que lleguen a este mismo contenedor tibio: se prepara
            // un nuevo intento para la siguiente petición. initializeDatabase
            // ya reintenta varias veces internamente ante fallos de red
            // transitorios, así que normalmente ni siquiera hace falta
            // llegar aquí — pero si llega, la próxima persona que lo intente
            // ya no hereda este mismo fallo.
            dbReadyPromise = initializeDatabase();
            dbReadyPromise.catch((e) => console.error('❌ Error inicializando la base de datos:', e));
            res.status(503).json({ success: false, message: 'Base de datos no disponible, intenta de nuevo en un momento.' });
        });
});

// Security and basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes mapping
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/technicians', require('./routes/technicians.routes'));
app.use('/api/requests', require('./routes/requests.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server
// En Vercel, el runtime de Node para funciones serverless invoca este
// módulo como un handler de petición/respuesta (no necesita que el proceso
// escuche un puerto), así que `app.listen` solo se ejecuta fuera de Vercel.
if (!process.env.VERCEL) {
    dbReadyPromise
        .then(() => {
            app.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
            });
        })
        .catch(() => {
            console.error('🚫 El servidor no se inició porque la base de datos falló al inicializar.');
            process.exit(1);
        });
}

module.exports = app;
