const { pool } = require('../config/db');
const rateModel = require('../models/rateModel');

const rateService = {
    updateRate: async (rateId, amount) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Check if rate exists
            const [rate] = await conn.query(
                'SELECT rate_id FROM Rates WHERE rate_id = ?',
                [rateId]
            );
            if (!rate || rate.length === 0) {
                throw new Error('Rate not found.');
            }

            // Update the rate
            await rateModel.updateRate(rateId, amount, conn);

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
};

module.exports = rateService;