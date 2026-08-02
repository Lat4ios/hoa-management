const { pool } = require('../config/db');
const PaymentModel = require('../models/paymentModel');

const PaymentService = {
    // ── Dues ──────────────────────────────────────────────────────────────────

    getAllDues: async () => {
        return await PaymentModel.getAllDues();
    },

    getDuesByResident: async (resident_id) => {
        return await PaymentModel.getDuesByResident(resident_id);
    },

    createDue: async (data) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const [resident] = await conn.query(
                'SELECT resident_id FROM Resident WHERE resident_id = ? AND deleteFlag = 0',
                [data.resident_id]
            );
            if (!resident || resident.length === 0) {
                throw new Error('Resident not found');
            }

            const dueId = await PaymentModel.createDue(data, conn);
            await conn.commit();
            return dueId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    updateDue: async (due_id, data) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const existing = await PaymentModel.getDueById(due_id);
            if (!existing) {
                throw new Error('Due not found');
            }

            if (data.is_paid && !existing.is_paid) {
                await PaymentModel.createPayment({
                    due_id: due_id,
                    resident_id: existing.resident_id,
                    amount: data.due_amount || existing.due_amount,
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: 'Cash',
                    notes: 'Auto-generated payment from due update'
                }, conn);
            }

            await PaymentModel.updateDue(due_id, data, conn);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    deleteDue: async (due_id) => {
        return await PaymentModel.deleteDue(due_id);
    },

    getActiveResidents: async () => {
        return await PaymentModel.getAllActiveResidents();
    },

    // ── Payments ─────────────────────────────────────────────────────────────

    getAllPayments: async () => {
        return await PaymentModel.getAllPayments();
    },

    createPayment: async (data) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const due = await PaymentModel.getDueById(data.due_id);
            if (!due) {
                throw new Error('Due not found');
            }
            if (due.is_paid) {
                throw new Error('This due is already paid');
            }

            const paymentId = await PaymentModel.createPayment(data, conn);
            await PaymentModel.markDueAsPaid(data.due_id, conn);
            
            await conn.commit();
            return paymentId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    updatePayment: async (payment_id, data) => {
        return await PaymentModel.updatePayment(payment_id, data);
    },

    deletePayment: async (payment_id) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            
            const [payment] = await conn.query(
                'SELECT due_id FROM Payments WHERE payment_id = ?',
                [payment_id]
            );
            
            if (payment && payment.length > 0) {
                await conn.query(
                    'UPDATE Dues SET is_paid = FALSE WHERE due_id = ?',
                    [payment[0].due_id]
                );
            }
            
            await PaymentModel.deletePayment(payment_id);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    getPaymentSummary: async () => {
        const summary = await PaymentModel.getPaymentSummary();
        return {
            total_collected: parseFloat(summary.total_collected) || 0,
            unpaid_dues: parseInt(summary.unpaid_dues) || 0,
            paid_dues: parseInt(summary.paid_dues) || 0,
            total_unpaid_amount: parseFloat(summary.total_unpaid_amount) || 0
        };
    },

    getMonthlyCollection: async (year, month) => {
        return await PaymentModel.getMonthlyCollection(year, month);
    }
};

module.exports = PaymentService;