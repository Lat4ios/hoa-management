const { pool } = require('../config/db');
const boardMemberModel = require('../models/boardMemberModel');

const addBoardMember = async (data) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const existing = await boardMemberModel.getActiveBoardMemberByResidentId(data.resident_id, conn);
        if (existing) {
            throw new Error('This resident is already an active board member. Edit their existing entry to change positions.');
        }

        const positions = Array.isArray(data.position) ? data.position.join(',') : data.position;
        const board_id = await boardMemberModel.addBoardMember(
            { ...data, position: positions },
            data.resident_id,
            conn
        );
        await conn.commit();
        return board_id;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const updateBoardMember = async (data) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const positions = Array.isArray(data.position) ? data.position.join(',') : data.position;
        await boardMemberModel.updateBoardMember({ ...data, position: positions }, data.board_id, conn);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const endTerm = async (board_id, end_date) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await boardMemberModel.endTermBoardMember(board_id, end_date, conn);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const deleteBoardMember = async (board_id) => {
    return await boardMemberModel.deleteBoardMember(board_id);
};

module.exports = {
    addBoardMember,
    updateBoardMember,
    endTerm,
    deleteBoardMember,
};
