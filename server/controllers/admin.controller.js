const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getDashboard = (req, res) => {
    try {
        const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
        const activeTechs = db.prepare("SELECT COUNT(*) as count FROM technician_profiles WHERE is_available = 1").get().count;
        const totalRevenueRow = db.prepare("SELECT SUM(company_commission) as total FROM payments WHERE payment_status = 'completed'").get();
        const totalRevenue = totalRevenueRow.total || 0;
        
        res.json({ success: true, data: { totalUsers, activeTechs, totalRevenue } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getAllUsers = (req, res) => {
    try {
        const users = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users').all();
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.toggleUserStatus = (req, res) => {
    try {
        const { is_active } = req.body;
        db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
        res.json({ success: true, message: 'User status toggled' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getPayouts = (req, res) => {
    try {
        const payouts = db.prepare(`
            SELECT tp.*, u.name as technician_name 
            FROM technician_payouts tp 
            JOIN users u ON tp.technician_id = u.id
        `).all();
        res.json({ success: true, data: payouts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.processPayout = (req, res) => {
    try {
        db.prepare("UPDATE technician_payouts SET status = 'processed', paid_date = datetime('now') WHERE id = ?").run(req.params.id);
        res.json({ success: true, message: 'Payout processed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getRevenueReport = (req, res) => {
    try {
        const report = db.prepare(`
            SELECT strftime('%Y-%m', created_at) as month, SUM(company_commission) as revenue
            FROM payments
            WHERE payment_status = 'completed'
            GROUP BY month
            ORDER BY month DESC
        `).all();
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Vista de administrador para TODAS las solicitudes de servicio (sin la
// restricción de "solo las mías" que aplica requests.controller.js para
// clientes/técnicos). Antes no existía ninguna ruta admin para esto, por lo
// que un admin recibía 403 al intentar ver todas las solicitudes.
exports.getAllRequests = (req, res) => {
    try {
        const requests = db.prepare(`
            SELECT sr.*,
                   c.name as client_name, c.email as client_email,
                   t.name as technician_name,
                   s.name as service_name
            FROM service_requests sr
            JOIN users c ON sr.client_id = c.id
            LEFT JOIN users t ON sr.technician_id = t.id
            JOIN services s ON sr.service_id = s.id
            ORDER BY sr.created_at DESC
        `).all();
        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Crea un usuario con cualquier rol, incluido 'admin'. Esta es la única vía
// (junto con scripts/create-admin.js) para obtener un administrador: el
// registro público (auth.controller.js) nunca acepta 'admin'.
exports.createUser = (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;
        const allowedRoles = ['client', 'technician', 'admin'];

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos: name, email, password, role' });
        }
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Rol inválido. Debe ser uno de: ${allowedRoles.join(', ')}` });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ success: false, message: 'Ya existe un usuario con ese email' });
        }

        const password_hash = bcrypt.hashSync(password, 10);
        const insertUser = db.prepare(`
            INSERT INTO users (name, email, password_hash, phone, address, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `);
        const result = insertUser.run(name, email, password_hash, phone || null, address || null, role);

        if (role === 'technician') {
            // specialties se guarda como JSON (ver technicians.controller.js#getAll,
            // que hace JSON.parse sobre esta columna) — un string vacío no es JSON
            // válido y rompía ese endpoint.
            const specialtiesJson = JSON.stringify(Array.isArray(req.body.specialties) ? req.body.specialties : []);
            db.prepare(`
                INSERT INTO technician_profiles (user_id, specialties, description, is_available)
                VALUES (?, ?, ?, 1)
            `).run(result.lastInsertRowid, specialtiesJson, req.body.description || '');
        }

        const newUser = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json({ success: true, message: 'Usuario creado', data: newUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Cambia el rol de un usuario existente (p. ej. promover un cliente/técnico
// a admin, o degradar un admin). Un admin no puede quitarse su propio rol de
// admin para evitar que la cuenta se quede sin ningún administrador activo.
exports.updateUserRole = (req, res) => {
    try {
        const { role } = req.body;
        const targetId = Number(req.params.id);
        const allowedRoles = ['client', 'technician', 'admin'];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Rol inválido. Debe ser uno de: ${allowedRoles.join(', ')}` });
        }

        const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetId);
        if (!target) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (targetId === req.user.id && target.role === 'admin' && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'No puedes quitarte tu propio rol de administrador' });
        }

        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);

        if (role === 'technician') {
            const hasProfile = db.prepare('SELECT id FROM technician_profiles WHERE user_id = ?').get(targetId);
            if (!hasProfile) {
                db.prepare(`
                    INSERT INTO technician_profiles (user_id, specialties, description, is_available)
                    VALUES (?, '[]', '', 1)
                `).run(targetId);
            }
        }

        const updated = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(targetId);
        res.json({ success: true, message: 'Rol actualizado', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
