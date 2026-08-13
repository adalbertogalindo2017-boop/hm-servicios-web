const { db } = require('../config/database');

exports.create = (req, res) => {
    try {
        const { technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address } = req.body;
        const result = db.prepare(`
            INSERT INTO service_requests 
            (client_id, technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, technician_id, service_id, description, scheduled_date, client_latitude, client_longitude, client_address);
        
        res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getMyRequests = (req, res) => {
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
            query += ' WHERE sr.technician_id = ?';
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        
        const requests = db.prepare(query).all(req.user.id);
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getById = (req, res) => {
    try {
        const request = db.prepare(`
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

exports.updateStatus = (req, res) => {
    try {
        const { status, agreed_price } = req.body;
        // Verify ownership/role here in a real app
        let updateQuery = 'UPDATE service_requests SET status = ?';
        const params = [status];
        
        if (agreed_price) {
            updateQuery += ', agreed_price = ?';
            params.push(agreed_price);
        }
        
        if (status === 'completed') {
            updateQuery += ", completed_date = datetime('now')";
        }
        
        updateQuery += ' WHERE id = ? AND (technician_id = ? OR client_id = ?)';
        params.push(req.params.id, req.user.id, req.user.id);
        
        const result = db.prepare(updateQuery).run(...params);
        if (result.changes === 0) return res.status(404).json({ success: false, message: 'Not found or unauthorized' });
        
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.cancel = (req, res) => {
    try {
        const result = db.prepare(`
            UPDATE service_requests SET status = 'cancelled' 
            WHERE id = ? AND status = 'pending' AND (client_id = ? OR technician_id = ?)
        `).run(req.params.id, req.user.id, req.user.id);
        
        if (result.changes === 0) return res.status(400).json({ success: false, message: 'Cannot cancel request' });
        res.json({ success: true, message: 'Request cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
