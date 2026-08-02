const { pool } = require('../config/db');

const ExpenseModel = {
    getAllExpenses: async () => {
        const query = `
            SELECT 
                e.*,
                CONCAT(p.first_name, ' ', p.last_name) AS payor_name
            FROM expenses e
            LEFT JOIN Person p ON e.payor_id = p.person_id
            ORDER BY e.date_paid DESC, e.created_at DESC;
        `;
        const [rows] = await pool.query(query);
        return rows;
    },

    createExpense: async (expenseData) => {
        const query = `
            INSERT INTO expenses (
                category, payor_id, payor_type, 
                amount_expected, amount_paid, 
                date_paid, payment_method, 
                receipt_number, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            expenseData.category, 
            expenseData.payor_id,   
            expenseData.payor_type, 
            expenseData.amount_expected, 
            expenseData.amount_paid,
            expenseData.date_paid, 
            expenseData.payment_method,
            expenseData.receipt_number, 
            expenseData.remarks
        ];
        const [result] = await pool.query(query, values);
        return result;
    },

    updateExpense: async (id, updateData) => {
        const query = `UPDATE expenses SET ? WHERE expense_id = ?`;
        const [result] = await pool.query(query, [updateData, id]);
        return result;
    },

    deleteExpense: async (id) => {
        const query = `DELETE FROM expenses WHERE expense_id = ?`;
        const [result] = await pool.query(query, [id]);
        return result;
    }
};

module.exports = ExpenseModel;