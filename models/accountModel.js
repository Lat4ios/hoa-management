const { pool } = require('../config/db');

const AccountModel = {
    getAllAdmins: async () => {
        const [rows] = await pool.query(`
            SELECT 
                admin_id,
                username,
                email,
                contact_num,
                created_at,
                updated_at
            FROM Admin
            ORDER BY username ASC
        `);
        return rows;
    },

    getAdminById: async (admin_id) => {
        const [rows] = await pool.query(`
            SELECT 
                admin_id,
                username,
                email,
                contact_num,
                created_at,
                updated_at
            FROM Admin
            WHERE admin_id = ?
        `, [admin_id]);
        return rows[0] || null;
    },

    getAdminByUsername: async (username) => {
        const [rows] = await pool.query(
            `SELECT * FROM Admin WHERE username = ?`,
            [username]
        );
        return rows[0] || null;
    },

    getAdminByEmail: async (email) => {
        const [rows] = await pool.query(
            `SELECT * FROM Admin WHERE email = ?`,
            [email]
        );
        return rows[0] || null;
    },

    createAdmin: async (data, passwordHash) => {
        const [result] = await pool.query(`
            INSERT INTO Admin (username, password_hash, email, contact_num)
            VALUES (?, ?, ?, ?)
        `, [
            data.username,
            passwordHash,
            data.email,
            data.contact_num || null
        ]);
        return result.insertId;
    },

    updateAdmin: async (admin_id, data) => {
        const [result] = await pool.query(`
            UPDATE Admin
            SET 
                username = ?,
                email = ?,
                contact_num = ?
            WHERE admin_id = ?
        `, [
            data.username,
            data.email,
            data.contact_num || null,
            admin_id
        ]);
        return result.affectedRows;
    },

    updateAdminPassword: async (admin_id, passwordHash) => {
        const [result] = await pool.query(`
            UPDATE Admin
            SET password_hash = ?
            WHERE admin_id = ?
        `, [passwordHash, admin_id]);
        return result.affectedRows;
    },

    deleteAdmin: async (admin_id) => {
        const [result] = await pool.query(
            `DELETE FROM Admin WHERE admin_id = ?`,
            [admin_id]
        );
        return result.affectedRows;
    },

    getAllBoardMemberAccounts: async () => {
        const [rows] = await pool.query(`
            SELECT 
                bma.account_id,
                bma.username,
                bma.email,
                bma.contact_num,
                bma.isActive,
                bma.last_login,
                bma.created_at,
                bma.updated_at,
                bma.board_member_id,
                CONCAT(p.first_name, ' ', p.last_name) AS board_member_name,
                bm.position
            FROM BoardMemberAccount bma
            LEFT JOIN Board_Member bm ON bma.board_member_id = bm.board_id
            LEFT JOIN Resident r ON bm.resident_id = r.resident_id
            LEFT JOIN Person p ON r.person_id = p.person_id
            ORDER BY bma.username ASC
        `);
        return rows;
    },

    getBoardMemberAccountById: async (account_id) => {
        const [rows] = await pool.query(`
            SELECT 
                bma.account_id,
                bma.username,
                bma.email,
                bma.contact_num,
                bma.isActive,
                bma.last_login,
                bma.created_at,
                bma.updated_at,
                bma.board_member_id,
                CONCAT(p.first_name, ' ', p.last_name) AS board_member_name
            FROM BoardMemberAccount bma
            LEFT JOIN Board_Member bm ON bma.board_member_id = bm.board_id
            LEFT JOIN Resident r ON bm.resident_id = r.resident_id
            LEFT JOIN Person p ON r.person_id = p.person_id
            WHERE bma.account_id = ?
        `, [account_id]);
        return rows[0] || null;
    },

    getBoardMemberAccountByUsername: async (username) => {
        const [rows] = await pool.query(
            `SELECT * FROM BoardMemberAccount WHERE username = ?`,
            [username]
        );
        return rows[0] || null;
    },

    getBoardMemberAccountByEmail: async (email) => {
        const [rows] = await pool.query(
            `SELECT * FROM BoardMemberAccount WHERE email = ?`,
            [email]
        );
        return rows[0] || null;
    },

    getAvailableBoardMembers: async () => {
        const [rows] = await pool.query(`
            SELECT 
                bm.board_id,
                CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                bm.position
            FROM Board_Member bm
            JOIN Resident r ON bm.resident_id = r.resident_id
            JOIN Person p ON r.person_id = p.person_id
            WHERE bm.board_end_date IS NULL
              AND bm.board_id NOT IN (
                  SELECT board_member_id 
                  FROM BoardMemberAccount 
                  WHERE board_member_id IS NOT NULL
              )
            ORDER BY p.last_name ASC
        `);
        return rows;
    },

    createBoardMemberAccount: async (data, passwordHash) => {
        const [result] = await pool.query(`
            INSERT INTO BoardMemberAccount (username, password_hash, email, contact_num, board_member_id, isActive)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            data.username,
            passwordHash,
            data.email,
            data.contact_num || null,
            data.board_member_id || null,
            data.isActive !== undefined ? data.isActive : 1
        ]);
        return result.insertId;
    },

    updateBoardMemberAccount: async (account_id, data) => {
        const [result] = await pool.query(`
            UPDATE BoardMemberAccount
            SET 
                username = ?,
                email = ?,
                contact_num = ?,
                board_member_id = ?,
                isActive = ?
            WHERE account_id = ?
        `, [
            data.username,
            data.email,
            data.contact_num || null,
            data.board_member_id || null,
            data.isActive !== undefined ? data.isActive : 1,
            account_id
        ]);
        return result.affectedRows;
    },

    updateBoardMemberPassword: async (account_id, passwordHash) => {
        const [result] = await pool.query(`
            UPDATE BoardMemberAccount
            SET password_hash = ?
            WHERE account_id = ?
        `, [passwordHash, account_id]);
        return result.affectedRows;
    },

    deleteBoardMemberAccount: async (account_id) => {
        const [result] = await pool.query(
            `DELETE FROM BoardMemberAccount WHERE account_id = ?`,
            [account_id]
        );
        return result.affectedRows;
    },

    updateLastLogin: async (table, id) => {
        await pool.query(
            `UPDATE ${table} SET last_login = NOW() WHERE ${table === 'Admin' ? 'admin_id' : 'account_id'} = ?`,
            [id]
        );
    },

    getAdminContactInfo: async () => {
        const [rows] = await pool.query(`
            SELECT 
                email,
                contact_num
            FROM Admin
            LIMIT 1
        `);
        return rows[0] || null;
    },

    updateAdminContactInfo: async (data) => {
        const [result] = await pool.query(`
            UPDATE Admin
            SET email = ?, contact_num = ?
            WHERE admin_id = 1
        `, [data.email, data.contact_num]);
        return result.affectedRows;
    }
};

module.exports = AccountModel;