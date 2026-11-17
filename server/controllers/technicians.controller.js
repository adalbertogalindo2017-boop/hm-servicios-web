const { db } = require('../config/database');
const { findNearbyTechnicians } = require('../utils/geolocation');

exports.getAll = async (req, res) => {
    try {
        const technicians = await db.prepare(`
            SELECT u.id, u.name, u.avatar, tp.specialties, tp.rating_avg, tp.is_available
            FROM users u
            JOIN technician_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'technician' AND u.is_active = 1
        `).all();

        // Parse specialties JSON. Una fila con un valor no-JSON (p. ej. vacío)
        // no debe tumbar la respuesta completa para todos los técnicos.
        technicians.forEach(t => {
            try { t.specialties = JSON.parse(t.specialties); }
            catch { t.specialties = []; }
        });
        res.json({ success: true, data: technicians });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getNearby = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

        const technicians = await findNearbyTechnicians(db, parseFloat(lat), parseFloat(lng), radius ? parseFloat(radius) : 10);
        res.json({ success: true, data: technicians });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const tech = await db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, tp.*
            FROM users u
            JOIN technician_profiles tp ON u.id = tp.user_id
            WHERE u.id = ? AND u.role = 'technician'
        `).get(req.params.id);

        if (!tech) return res.status(404).json({ success: false, message: 'Technician not found' });
        try { tech.specialties = JSON.parse(tech.specialties); }
        catch { tech.specialties = []; }

        const reviews = await db.prepare('SELECT r.*, u.name as client_name FROM reviews r JOIN users u ON r.client_id = u.id WHERE r.technician_id = ?').all(tech.id);

        res.json({ success: true, data: { ...tech, reviews } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { specialties, description, is_available } = req.body;
        await db.prepare('UPDATE technician_profiles SET specialties = ?, description = ?, is_available = ? WHERE user_id = ?')
          .run(JSON.stringify(specialties), description, is_available ? 1 : 0, req.user.id);
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.toggleAvailability = async (req, res) => {
    try {
        const { is_available } = req.body;
        await db.prepare('UPDATE technician_profiles SET is_available = ? WHERE user_id = ?').run(is_available ? 1 : 0, req.user.id);
        res.json({ success: true, message: 'Availability toggled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
