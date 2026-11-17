const { db } = require('../config/database');

exports.getAll = async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM services WHERE is_active = 1';
        const params = [];
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        const services = await db.prepare(query).all(...params);
        res.json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, category, description, base_price, estimated_time, icon } = req.body;
        const result = await db.prepare(`
            INSERT INTO services (name, category, description, base_price, estimated_time, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, category, description, base_price, estimated_time, icon);

        res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, base_price } = req.body;
        await db.prepare('UPDATE services SET name = ?, base_price = ? WHERE id = ?').run(name, base_price, req.params.id);
        res.json({ success: true, message: 'Service updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        await db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Service deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
