const { pool } = require('../config/db');

const PAYMENT_SELECT = `
    SELECT
        p.payment_id,
        p.purpose,
        p.amount_expected,
        p.amount_paid,
        p.date_paid,
        p.payment_method,
        p.receipt_number,
        p.remarks,
        p.created_at,
        p.paid_by,
        CONCAT(per.first_name, ' ', per.last_name) AS payer_name
    FROM Payment p
    LEFT JOIN Person per ON p.paid_by = per.person_id
`;

const getAllPayments = async () => {
    const [rows] = await pool.query(
        `${PAYMENT_SELECT} ORDER BY p.created_at DESC`
    );
    return rows;
};

const getPaymentsByPurpose = async (purpose) => {
    const [rows] = await pool.query(
        `${PAYMENT_SELECT} WHERE p.purpose = ? ORDER BY p.created_at DESC`,
        [purpose]
    );
    return rows;
};

const createPayment = async (data, conn) => {
    const [result] = await conn.query(`
        INSERT INTO Payment
            (purpose, amount_expected, amount_paid, date_paid,
             payment_method, receipt_number, remarks, paid_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.purpose,
        data.amount_expected  || 0,
        data.amount_paid      || 0,
        data.date_paid        || null,
        data.payment_method,
        data.receipt_number   || null,
        data.remarks          || null,
        data.paid_by          || null,
    ]);
    return result.insertId;
};

const updatePayment = async (payment_id, data, conn) => {
    // paid_by and amount_expected are intentionally excluded — they are set at
    // creation time and must not be changed after the fact.
    const [result] = await conn.query(`
        UPDATE Payment
        SET purpose = ?, amount_paid = ?, date_paid = ?,
            payment_method = ?, receipt_number = ?, remarks = ?
        WHERE payment_id = ?
    `, [
        data.purpose,
        data.amount_paid      || 0,
        data.date_paid        || null,
        data.payment_method,
        data.receipt_number   || null,
        data.remarks          || null,
        payment_id,
    ]);
    return result.affectedRows;
};

const deletePayment = async (payment_id) => {
    const [result] = await pool.query(
        `DELETE FROM Payment WHERE payment_id = ?`,
        [payment_id]
    );
    return result.affectedRows;
};

const getAllPersons = async () => {
    const [rows] = await pool.query(`
        SELECT person_id,
               CONCAT(first_name, ' ', last_name) AS full_name
        FROM Person
        ORDER BY last_name, first_name
    `);
    return rows;
};

const getResidentsByProperty = async () => {
    const [rows] = await pool.query(`
        SELECT rp.property_id, r.resident_id, p.person_id,
               CONCAT(p.first_name, ' ', p.last_name) AS full_name,
               r.isDelinquent,
               rp.type AS resident_type
        FROM Resident_Property rp
        JOIN Resident r  ON rp.resident_id = r.resident_id
        JOIN Person   p  ON r.person_id    = p.person_id
        ORDER BY FIELD(rp.type, 'Homeowner', 'Tenant'), p.last_name, p.first_name
    `);
    const map = {};
    for (const row of rows) {
        if (!map[row.property_id]) map[row.property_id] = [];
        map[row.property_id].push({
            person_id:     row.person_id,
            resident_id:   row.resident_id,
            full_name:     row.full_name,
            isDelinquent:  !!row.isDelinquent,
            resident_type: row.resident_type,
        });
    }
    return map;
};

const createAssociationDuesRecord = async (paymentId, isAnnual, conn) => {
    await conn.query(
        `INSERT INTO Association_Dues (payment_id, is_annual) VALUES (?, ?)`,
        [paymentId, isAnnual ? 1 : 0]
    );
};

const createOutstandingBalanceRecord = async (paymentId, propertyId, residentId, conn) => {
    await conn.query(
        `INSERT INTO Outstanding_Balance (payment_id, property_id, resident_id) VALUES (?, ?, ?)`,
        [paymentId, propertyId || null, residentId || null]
    );
};

const createPaymentVehicleLinks = async (paymentId, vehicleRates, conn) => {
    // vehicleRates: [{ vehicle_id, rateCategory }, ...]
    for (const { vehicle_id, rateCategory } of vehicleRates) {
        await conn.query(
            `INSERT INTO Payment_Vehicle (payment_id, vehicle_id, rate_applied) VALUES (?, ?, ?)`,
            [paymentId, vehicle_id, rateCategory]
        );
    }
};

module.exports = {
    getAllPayments,
    getPaymentsByPurpose,
    createPayment,
    updatePayment,
    deletePayment,
    getAllPersons,
    getResidentsByProperty,
    createOutstandingBalanceRecord,
    createPaymentVehicleLinks,
    createAssociationDuesRecord,
};
