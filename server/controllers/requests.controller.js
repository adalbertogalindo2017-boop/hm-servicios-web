const { db } = require('../config/database');

exports.create = async (req, res) => {
    try {
        const { technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address } = req.body;
        const result = await db.prepare(`
            INSERT INTO service_requests
            (client_id, technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address);

        res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (error) {
        console.error('[requests.create] Error creando solicitud:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        let query = `
            SELECT sr.*, s.name as service_name, s.icon,
                   u1.name as client_name, u2.name as technician_name
            FROM service_requests sr
            JOIN services s ON sr.service_id = s.id
            JOIN users u1 ON sr.client_id = u1.id
            LEFT JOIN users u2 ON sr.technician_id = u2.id
        `;
        if (req.user.role === 'client') {
            query += ' WHERE sr.client_id = ?';
        } else if (req.user.role === 'technician') {
            // Incluye tanto las solicitudes ya asignadas a este técnico como
            // las pendientes sin asignar (creadas desde el flujo "solicitar
            // servicio" sin elegir técnico de antemano), para que cualquier
            // técnico disponible pueda verlas y aceptarlas. Antes solo se
            // mostraban las ya asignadas, así que una solicitud sin técnico
            // nunca llegaba a aparecer en el panel de ningún técnico.
            query += ' WHERE sr.technician_id = ? OR (sr.technician_id IS NULL AND sr.status = \'pending\')';
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const requests = await db.prepare(query).all(req.user.id);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('[requests.getMyRequests] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const request = await db.prepare(`
            SELECT sr.*, s.name as service_name, u.name as technician_name, u.phone as technician_phone
            FROM service_requests sr
            JOIN services s ON sr.service_id = s.id
            LEFT JOIN users u ON sr.technician_id = u.id
            WHERE sr.id = ? AND (sr.client_id = ? OR sr.technician_id = ? OR ? = 'admin')
        `).get(req.params.id, req.user.id, req.user.id, req.user.role);

        if (!request) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });
        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, agreed_price } = req.body;
        // Verify ownership/role here in a real app
        let updateQuery = 'UPDATE service_requests SET status = ?';
        const params = [status];

        if (agreed_price) {
            updateQuery += ', agreed_price = ?';
            params.push(agreed_price);
        }

        // Un técnico que acepta una solicitud todavía sin asignar (el caso
        // normal cuando el cliente pidió el servicio sin elegir técnico de
        // antemano) queda asignado en ese mismo paso.
        if (status === 'accepted' && req.user.role === 'technician') {
            updateQuery += ', technician_id = ?';
            params.push(req.user.id);
        }

        // Un técnico que rechaza una solicitud la libera (vuelve a quedar
        // sin asignar) para que otro técnico disponible pueda tomarla, en
        // vez de dejarla "atascada" asignada a alguien que ya dijo que no.
        if (status === 'pending' && req.user.role === 'technician') {
            updateQuery += ', technician_id = NULL';
        }

        if (status === 'completed') {
            updateQuery += ", completed_date = datetime('now')";
        }

        // Autoriza el cambio si la solicitud ya le pertenece (como cliente o
        // como técnico asignado) o si está pendiente y sin técnico asignado
        // todavía — ese es el caso de un técnico tomando una solicitud
        // abierta por primera vez, que antes nunca pasaba esta condición
        // (ni technician_id ni client_id coinciden con nadie) y siempre
        // devolvía 404 aunque la solicitud fuera legítima.
        updateQuery += ` WHERE id = ? AND (
            technician_id = ? OR client_id = ? OR (technician_id IS NULL AND status = 'pending')
        )`;
        params.push(req.params.id, req.user.id, req.user.id);

        const result = await db.prepare(updateQuery).run(...params);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });

        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('[requests.updateStatus] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.cancel = async (req, res) => {
    try {
        const result = await db.prepare(`
            UPDATE service_requests SET status = 'cancelled'
            WHERE id = ? AND status = 'pending' AND (client_id = ? OR technician_id = ?)
        `).run(req.params.id, req.user.id, req.user.id);

        if (result.changes === 0) return res.status(400).json({ success: false, message: 'Cannot cancel request' });
        res.json({ success: true, message: 'Request cancelled' });
    } catch (error) {
        console.error('[requests.cancel] Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
