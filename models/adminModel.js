const { pool } = require('../config/db');

const AdminModel = {
    getHoaContactInfo: async () => {
        const [rows] = await pool.query(`
            SELECT 
                hoa_name,
                hoa_address,
                hoa_email,
                hoa_contact_num,
                hoa_website,
                hoa_facebook
            FROM HOA_Settings
            LIMIT 1
        `);
        return rows[0] || null;
    }
};

module.exports = AdminModel;