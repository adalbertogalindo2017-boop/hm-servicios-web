const { db } = require('../config/database');
const { generateTransactionId } = require('../utils/helpers');

exports.processPayment = async (req, res) => {
    try {
        const { service_request_id, payment_method, amount } = req.body;

        // Verify request belongs to user and is ready for payment
        const request = await db.prepare('SELECT * FROM service_requests WHERE id = ? AND client_id = ?').get(service_request_id, req.user.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        // 'paid' nunca ha sido un valor válido de service_requests.status (el
        // CHECK constraint solo permite pending/accepted/in_progress/completed/
        // cancelled), así que el estado "ya pagado" se verifica contra la
        // tabla payments, no contra service_requests.status.
        const existingPayment = await db.prepare('SELECT id FROM payments WHERE service_request_id = ?').get(service_request_id);
        if (existingPayment) return res.status(400).json({ success: false, message: 'Already paid' });

        const company_commission = amount * 0.15; // 15% commission
        const technician_payment = amount * 0.85; // 85% to tech
        const transaction_id = generateTransactionId();

        await db.transaction(async () => {
            await db.prepare(`
                INSERT INTO payments (service_request_id, amount, company_commission, technician_payment, payment_method, payment_status, transaction_id)
                VALUES (?, ?, ?, ?, ?, 'completed', ?)
            `).run(service_request_id, amount, company_commission, technician_payment, payment_method, transaction_id);

            // El estado de la solicitud se queda en 'completed' (ya lo estaba
            // antes de pagar); el pago en sí se trackea en payments.payment_status.
            if (request.technician_id) {
                await db.prepare('UPDATE technician_profiles SET total_earnings = total_earnings + ? WHERE user_id = ?').run(technician_payment, request.technician_id);
            }
        })();

        res.json({ success: true, data: { transaction_id, status: 'completed' } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        let query = `
            SELECT p.*, sr.description as service_desc, s.name as service_name
            FROM payments p
            JOIN service_requests sr ON p.service_request_id = sr.id
            JOIN services s ON sr.service_id = s.id
        `;
        if (req.user.role === 'client') {
            query += ' WHERE sr.client_id = ?';
        } else if (req.user.role === 'technician') {
            query += ' WHERE sr.technician_id = ?';
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const payments = await db.prepare(query).all(req.user.id);
        res.json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getPaymentDetail = async (req, res) => {
    try {
        // Antes esta consulta no verificaba dueño: cualquier usuario logueado
        // podía ver el pago de cualquier otra persona (monto, comisión, etc.)
        // solo cambiando el id en la URL. Ahora se hace join con
        // service_requests para confirmar que el pago pertenece al cliente o
        // al técnico que lo pide; un admin puede ver cualquiera.
        const payment = await db.prepare(`
            SELECT p.*
            FROM payments p
            JOIN service_requests sr ON p.service_request_id = sr.id
            WHERE p.id = ?
        `).get(req.params.id);

        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

        if (req.user.role !== 'admin') {
            const owned = await db.prepare(`
                SELECT 1 FROM service_requests
                WHERE id = ? AND (client_id = ? OR technician_id = ?)
            `).get(payment.service_request_id, req.user.id, req.user.id);
            if (!owned) return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        res.json({ success: true, data: payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
