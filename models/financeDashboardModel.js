const { pool } = require('../config/db');

const getFinanceStats = async () => {
    const [[ytd]] = await pool.query(`
        SELECT COALESCE(SUM(amount_paid), 0) AS total
        FROM Payment
        WHERE YEAR(date_paid) = YEAR(CURDATE())
    `);

    const [[monthly]] = await pool.query(`
        SELECT COALESCE(SUM(amount_paid), 0) AS total
        FROM Payment
        WHERE YEAR(date_paid)  = YEAR(CURDATE())
          AND MONTH(date_paid) = MONTH(CURDATE())
    `);

    const [[allTime]] = await pool.query(`
        SELECT
            COALESCE(SUM(amount_paid), 0) AS total_collected,
            COALESCE(SUM(CASE WHEN amount_paid < amount_expected THEN amount_expected - amount_paid ELSE 0 END), 0) AS total_uncollected,
            COUNT(CASE WHEN amount_paid < amount_expected THEN 1 END) AS pending_count
        FROM Payment
    `);

    const [[outstanding]] = await pool.query(`
        SELECT COALESCE(SUM(outstandingBalance), 0) AS total
        FROM Property
        WHERE hasDues = 1
    `);

    return {
        ytdCollected:      parseFloat(ytd.total),
        monthlyCollected:  parseFloat(monthly.total),
        totalCollected:    parseFloat(allTime.total_collected),
        totalUncollected:  parseFloat(allTime.total_uncollected),
        pendingCount:      allTime.pending_count,
        outstandingDues:   parseFloat(outstanding.total),
    };
};

const getRecentTransactions = async () => {
    const [rows] = await pool.query(`
        SELECT
            pay.purpose,
            pay.amount_paid,
            pay.amount_expected,
            pay.date_paid,
            CONCAT(per.first_name, ' ', per.last_name) AS payer_name,
            CONCAT('Lot ', prop.lot_number, ' ', prop.street_name) AS address
        FROM Payment pay
        LEFT JOIN Person per ON pay.paid_by = per.person_id
        LEFT JOIN Resident r
               ON per.person_id = r.person_id AND r.residency_end_date IS NULL
        LEFT JOIN Resident_Property rp ON r.resident_id = rp.resident_id
        LEFT JOIN Property prop        ON rp.property_id = prop.property_id
        ORDER BY pay.created_at DESC
        LIMIT 10
    `);
    return rows;
};

module.exports = { getFinanceStats, getRecentTransactions };
