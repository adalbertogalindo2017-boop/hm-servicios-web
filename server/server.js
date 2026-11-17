const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

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
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
