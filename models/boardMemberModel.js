const { pool } = require('../config/db');

const selectAllResidents = async () => {
    const [rows] = await pool.query(`
        SELECT r.resident_id, CONCAT(p.first_name, ' ', p.last_name) AS full_name
        FROM Resident r
        JOIN Person p ON r.person_id = p.person_id
        ORDER BY p.last_name ASC
    `);
    return rows;
};

const getAllBoardMembers = async () => {
    const [rows] = await pool.query(`
        SELECT
            bm.board_id,
            bm.position,
            bm.board_start_date,
            bm.board_end_date,
            bm.resident_id,
            p.first_name,
            p.last_name,
            p.contact_num,
            p.email
        FROM Board_Member bm
        JOIN Resident r ON bm.resident_id = r.resident_id
        JOIN Person p   ON r.person_id    = p.person_id
        ORDER BY p.last_name ASC
    `);
    return rows;
};

const getBoardMemberByResidentId = async (resident_id, conn) => {
    const [rows] = await conn.query(`
        SELECT bm.board_id, bm.resident_id, r.person_id
        FROM Board_Member bm
        JOIN Resident r ON bm.resident_id = r.resident_id
        WHERE bm.resident_id = ?`,
        [resident_id]
    );
    return rows[0];
};

const getActiveBoardMemberByResidentId = async (resident_id, conn) => {
    const db = conn || pool;
    const [rows] = await db.query(
        `SELECT board_id FROM Board_Member WHERE resident_id = ? AND board_end_date IS NULL`,
        [resident_id]
    );
    return rows[0] || null;
};

const addBoardMember = async (data, resident_id, conn) => {
    const [result] = await conn.query(`
        INSERT INTO Board_Member (position, board_start_date, board_end_date, resident_id)
        VALUES (?, ?, ?, ?)`,
        [data.position, data.board_start_date, data.board_end_date || null, resident_id]
    );
    return result.insertId;
};

const updateBoardMember = async (data, board_id, conn) => {
    const [result] = await conn.query(`
        UPDATE Board_Member
        SET position = ?, board_start_date = ?, board_end_date = ?
        WHERE board_id = ?`,
        [data.position, data.board_start_date, data.board_end_date || null, board_id]
    );
    return result.affectedRows;
};

const endTermBoardMember = async (board_id, end_date, conn) => {
    const [result] = await conn.query(`
        UPDATE Board_Member SET board_end_date = ? WHERE board_id = ?`,
        [end_date, board_id]
    );
    return result.affectedRows;
};

const deleteBoardMember = async (board_id) => {
    const [result] = await pool.query(
        `DELETE FROM Board_Member WHERE board_id = ?`,
        [board_id]
    );
    return result.affectedRows;
};

module.exports = {
    selectAllResidents,
    getAllBoardMembers,
    getBoardMemberByResidentId,
    getActiveBoardMemberByResidentId,
    addBoardMember,
    updateBoardMember,
    endTermBoardMember,
    deleteBoardMember,
};
