const { db } = require('../config/database');

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
