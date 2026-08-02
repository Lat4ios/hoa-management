const { pool } = require('../config/db');

const getStats = async () => {
    const [[residents]]    = await pool.query(`SELECT COUNT(*) AS cnt FROM Resident WHERE residency_end_date IS NULL`);
    const [[properties]]   = await pool.query(`SELECT COUNT(*) AS cnt FROM Property`);
    const [[employees]]    = await pool.query(`SELECT COUNT(*) AS cnt FROM Employee WHERE employee_end_date IS NULL`);
    const [[vehicles]]     = await pool.query(`SELECT COUNT(*) AS cnt FROM Vehicle`);
    const [[finance]]      = await pool.query(`
        SELECT
            COALESCE(SUM(amount_paid), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN amount_paid < amount_expected THEN amount_expected - amount_paid ELSE 0 END), 0) AS total_collectibles,
            COUNT(CASE WHEN amount_paid < amount_expected THEN 1 END) AS pending_count
        FROM Payment
    `);
    const [[outstanding]]  = await pool.query(`
        SELECT
            COALESCE(SUM(outstandingBalance), 0) AS total_outstanding,
            COUNT(CASE WHEN hasDues = 1 THEN 1 END) AS delinquent_properties
        FROM Property
    `);
    const [[delinquents]]  = await pool.query(`SELECT COUNT(*) AS cnt FROM Resident WHERE isDelinquent = 1`);
    return {
        totalResidents:         residents.cnt,
        totalProperties:        properties.cnt,
        totalEmployees:         employees.cnt,
        totalVehicles:          vehicles.cnt,
        totalRevenue:           parseFloat(finance.total_revenue),
        totalCollectibles:      parseFloat(finance.total_collectibles),
        pendingCount:           finance.pending_count,
        totalOutstanding:       parseFloat(outstanding.total_outstanding),
        delinquentProperties:   outstanding.delinquent_properties,
        delinquentResidents:    delinquents.cnt,
    };
};

const getPropertyStatus = async () => {
    const [[result]] = await pool.query(`
        SELECT
            COUNT(DISTINCT p.property_id) AS total,
            COUNT(DISTINCT occ.property_id) AS occupied
        FROM Property p
        LEFT JOIN (
            SELECT DISTINCT rp.property_id
            FROM Resident_Property rp
            JOIN Resident r ON rp.resident_id = r.resident_id
            WHERE r.residency_end_date IS NULL
        ) AS occ ON p.property_id = occ.property_id
    `);
    const total    = result.total;
    const occupied = result.occupied;
    const vacant   = total - occupied;
    return {
        total,
        occupied,
        vacant,
        occupiedPct: total ? Math.round((occupied / total) * 100) : 0,
        vacantPct:   total ? Math.round((vacant   / total) * 100) : 0,
    };
};

const getDelinquents = async () => {
    const [rows] = await pool.query(`
        (
            /* ── Outstanding Balance ──────────────────────────────────────────────
               Source of truth is Property.outstandingBalance, NOT payment rows.
               One row per property; show the homeowner. */
            SELECT
                CONCAT(ho.first_name, ' ', ho.last_name) AS full_name,
                ho.contact_num,
                'Outstanding Balance'                     AS purpose,
                prop.outstandingBalance                   AS balance
            FROM Property prop
            JOIN (
                SELECT p.property_id, MIN(ho_p.person_id) AS person_id
                FROM Property p
                JOIN Resident_Property rp_h ON p.property_id    = rp_h.property_id  AND rp_h.type = 'Homeowner'
                JOIN Resident          r_h  ON rp_h.resident_id = r_h.resident_id   AND r_h.residency_end_date IS NULL
                JOIN Person            ho_p ON r_h.person_id    = ho_p.person_id
                GROUP BY p.property_id
            ) prop_owner ON prop.property_id = prop_owner.property_id
            JOIN Person ho ON prop_owner.person_id = ho.person_id
            WHERE prop.outstandingBalance > 0
        )
        UNION ALL
        (
            /* ── Other payment types (Assoc Dues, Vehicle Sticker, General) ───────
               Group all residents of each property together; show the homeowner. */
            SELECT
                CONCAT(ho.first_name, ' ', ho.last_name)                                          AS full_name,
                ho.contact_num,
                GROUP_CONCAT(DISTINCT pay.purpose ORDER BY pay.purpose SEPARATOR ', ')             AS purpose,
                SUM(pay.amount_expected - pay.amount_paid)                                         AS balance
            FROM (
                SELECT p.property_id, MIN(ho_p.person_id) AS person_id
                FROM Property p
                JOIN Resident_Property rp_h ON p.property_id    = rp_h.property_id  AND rp_h.type = 'Homeowner'
                JOIN Resident          r_h  ON rp_h.resident_id = r_h.resident_id   AND r_h.residency_end_date IS NULL
                JOIN Person            ho_p ON r_h.person_id    = ho_p.person_id
                GROUP BY p.property_id
            ) prop_owner
            JOIN Person            ho     ON prop_owner.person_id    = ho.person_id
            JOIN Resident_Property rp_any ON prop_owner.property_id  = rp_any.property_id
            JOIN Resident          r_any  ON rp_any.resident_id      = r_any.resident_id AND r_any.residency_end_date IS NULL
            JOIN Person            p_any  ON r_any.person_id         = p_any.person_id
            JOIN Payment pay ON pay.paid_by = p_any.person_id
                             AND pay.amount_paid < pay.amount_expected
                             AND pay.purpose <> 'Outstanding Balance'
            GROUP BY prop_owner.property_id
        )
        ORDER BY balance DESC
        LIMIT 8
    `);
    return rows;
};

const getCurrentBoardMembers = async () => {
    const [rows] = await pool.query(`
        SELECT
            bm.position,
            bm.board_start_date,
            CONCAT(p.first_name, ' ', p.last_name) AS full_name,
            p.contact_num,
            p.email
        FROM Board_Member bm
        JOIN Resident r ON bm.resident_id = r.resident_id
        JOIN Person   p ON r.person_id    = p.person_id
        WHERE bm.board_end_date IS NULL
        ORDER BY bm.board_start_date ASC
    `);
    return rows;
};

const getRecentPayments = async () => {
    const [rows] = await pool.query(`
        SELECT
            pay.purpose,
            pay.amount_paid,
            pay.amount_expected,
            pay.date_paid,
            pay.payment_method,
            CONCAT(per.first_name, ' ', per.last_name) AS payer_name
        FROM Payment pay
        LEFT JOIN Person per ON pay.paid_by = per.person_id
        ORDER BY pay.created_at DESC
        LIMIT 6
    `);
    return rows;
};

module.exports = { getStats, getPropertyStatus, getDelinquents, getCurrentBoardMembers, getRecentPayments };
