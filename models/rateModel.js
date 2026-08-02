const { pool } = require('../config/db');

module.exports = {
    getActiveRates: async () => {
        const [rows] = await pool.execute(`
            SELECT rate_id, rate_category, amount 
            FROM Rates 
            ORDER BY 
                FIELD(rate_category, 
                    'Car',
                    'Car (More than 6 stickers)',
                    'Motorcycle',
                    'Commercial',
                    'House (Monthly Payment)',
                    'Lot (Monthly Payment)',
                    'House (Annual Payment)',
                    'Lot (Annual Payment)'
                )
        `);
        return rows;
    },

    updateRate: async (rateId, amount, conn = pool) => {
        await conn.execute(
            'UPDATE Rates SET amount = ? WHERE rate_id = ?',
            [amount, rateId]
        );
    },

    getRateByCategory: async (rateCategory, conn = pool) => {
        const [rows] = await conn.execute(
            'SELECT rate_id, rate_category, amount FROM Rates WHERE rate_category = ?',
            [rateCategory]
        );
        return rows[0] || null;
    }
};