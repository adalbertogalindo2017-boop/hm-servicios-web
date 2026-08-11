const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../utils/helpers');

exports.register = (req, res) => {
    try {
        const { name, email, password, phone, address, role, specialties, description } = req.body;
        
        // Check if user exists
        const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const password_hash = bcrypt.hashSync(password, 10);
        
        const insertUser = db.prepare(`
            INSERT INTO users (name, email, password_hash, phone, address, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        let userId;
        db.transaction(() => {
            const result = insertUser.run(name, email, password_hash, phone, address, role || 'client');
            userId = result.lastInsertRowid;

            if (role === 'technician') {
                const insertProfile = db.prepare(`
                    INSERT INTO technician_profiles (user_id, specialties, description)
                    VALUES (?, ?, ?)
                `);
                insertProfile.run(userId, JSON.stringify(specialties || []), description || '');
            }
        })();

        const token = generateToken({ id: userId, role: role || 'client' });
        res.status(201).json({ success: true, data: { token, user: { id: userId, name, email, role } } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

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

exports.getProfile = (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, phone, address, role, avatar FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.updateProfile = (req, res) => {
    try {
        const { name, phone, address } = req.body;
        db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
          .run(name, phone, address, req.user.id);
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
