const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../utils/helpers');

// Roles que un visitante puede elegir libremente al registrarse desde el
// formulario público. 'admin' NUNCA se acepta aquí: los administradores solo
// se crean desde el panel de administración (ver admin.controller.js) o con
// el script scripts/create-admin.js, ambos reservados a quien ya es admin.
const PUBLIC_REGISTRATION_ROLES = ['client', 'technician'];

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address, specialties, description } = req.body;
        const requestedRole = req.body.role;
        const role = PUBLIC_REGISTRATION_ROLES.includes(requestedRole) ? requestedRole : 'client';

        // Check if user exists
        const userExists = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const password_hash = bcrypt.hashSync(password, 10);

        const insertUser = db.prepare(`
            INSERT INTO users (name, email, password_hash, phone, address, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let userId;
        await db.transaction(async () => {
            const result = await insertUser.run(name, email, password_hash, phone, address, role);
            userId = result.lastInsertRowid;

            if (role === 'technician') {
                const insertProfile = db.prepare(`
                    INSERT INTO technician_profiles (user_id, specialties, description)
                    VALUES (?, ?, ?)
                `);
                await insertProfile.run(userId, JSON.stringify(specialties || []), description || '');
            }
        })();

        const token = generateToken({ id: userId, role });
        res.status(201).json({ success: true, data: { token, user: { id: userId, name, email, role } } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account deactivated' });
        }

        const token = generateToken({ id: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id });

        res.json({ success: true, data: { token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.refreshToken = (req, res) => {
    // In a real app, verify refresh token properly
    res.status(200).json({ success: true, message: 'Token refreshed' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await db.prepare('SELECT id, name, email, phone, address, role, avatar FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
          .run(name, phone, address, req.user.id);
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
