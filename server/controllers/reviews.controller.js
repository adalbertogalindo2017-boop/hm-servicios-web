const { db } = require('../config/database');

exports.create = async (req, res) => {
    try {
        const { service_request_id, rating, comment } = req.body;

        // 'paid' nunca fue un status válido de service_requests (el CHECK solo
        // permite pending/accepted/in_progress/completed/cancelled) y además la
        // comparación usaba comillas dobles, que SQLite trata como identificador
        // de columna: la consulta lanzaba "no such column: paid" en vez de
        // simplemente no encontrar la fila. Una reseña solo debería poder
        // crearse una vez que el servicio está 'completed'.
        const request = await db.prepare("SELECT technician_id FROM service_requests WHERE id = ? AND client_id = ? AND status = 'completed'").get(service_request_id, req.user.id);

        if (!request) return res.status(400).json({ success: false, message: 'Solicitud inválida o el servicio aún no está completado' });

        await db.transaction(async () => {
            await db.prepare(`
                INSERT INTO reviews (service_request_id, client_id, technician_id, rating, comment)
                VALUES (?, ?, ?, ?, ?)
            `).run(service_request_id, req.user.id, request.technician_id, rating, comment);

            // Update technician average rating
            const stats = await db.prepare('SELECT AVG(rating) as avg, COUNT(rating) as count FROM reviews WHERE technician_id = ?').get(request.technician_id);
            await db.prepare('UPDATE technician_profiles SET rating_avg = ?, total_services = ? WHERE user_id = ?')
              .run(stats.avg || 0, stats.count || 0, request.technician_id);
        })();

        res.status(201).json({ success: true, message: 'Review created' });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE constraint')) {
             return res.status(400).json({ success: false, message: 'Review already exists for this service' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getByTechnician = async (req, res) => {
    try {
        const reviews = await db.prepare(`
            SELECT r.*, u.name as client_name
            FROM reviews r
            JOIN users u ON r.client_id = u.id
            WHERE r.technician_id = ?
        `).all(req.params.id);
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
