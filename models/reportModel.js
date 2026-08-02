const { pool } = require('../config/db');

const getDelinquencyReportSummary = async () => {
    const [[summary]] = await pool.query(`
        SELECT
            COUNT(*)                                                     AS total_delinquent,
            COUNT(CASE WHEN property_type = 'House' THEN 1 END)         AS house_count,
            COUNT(CASE WHEN property_type = 'Lot'   THEN 1 END)         AS lot_count,
            COALESCE(SUM(outstandingBalance), 0)                         AS total_outstanding
        FROM Property
        WHERE hasDues = 1
    `);
    const [[{ total_properties }]] = await pool.query(`SELECT COUNT(*) AS total_properties FROM Property`);

    const delinquencyPct = total_properties > 0
        ? ((summary.total_delinquent / total_properties) * 100).toFixed(0)
        : 0;
    const housePct = summary.total_delinquent > 0
        ? ((summary.house_count / summary.total_delinquent) * 100).toFixed(0)
        : 0;
    const lotPct = summary.total_delinquent > 0
        ? ((summary.lot_count / summary.total_delinquent) * 100).toFixed(0)
        : 0;

    return {
        totalDelinquent:   summary.total_delinquent,
        houseCount:        summary.house_count,
        lotCount:          summary.lot_count,
        totalOutstanding:  parseFloat(summary.total_outstanding),
        totalProperties:   total_properties,
        delinquencyPct,
        housePct,
        lotPct,
    };
};

const getDelinquencyReportRows = async () => {
    const [rows] = await pool.query(`
        SELECT
            p.property_id,
            p.lot_number,
            p.property_type,
            p.street_name,
            p.outstandingBalance,
            COALESCE(
                GROUP_CONCAT(
                    DISTINCT CONCAT(per.last_name, ', ', per.first_name)
                    ORDER BY per.last_name
                    SEPARATOR ' / '
                ),
                '—'
            ) AS owner_names,
            (
                SELECT MAX(pay.date_paid)
                FROM Outstanding_Balance ob2
                JOIN Payment pay ON ob2.payment_id = pay.payment_id
                WHERE ob2.property_id = p.property_id
                  AND pay.date_paid IS NOT NULL
            ) AS last_payment_date
        FROM Property p
        LEFT JOIN Resident_Property rp
               ON p.property_id = rp.property_id AND rp.type = 'Homeowner'
        LEFT JOIN Resident r
               ON rp.resident_id = r.resident_id AND r.isActive = 1
        LEFT JOIN Person per ON r.person_id = per.person_id
        WHERE p.hasDues = 1
        GROUP BY p.property_id, p.lot_number, p.property_type,
                 p.street_name, p.outstandingBalance
        ORDER BY p.street_name, p.lot_number
    `);
    return rows;
};

const getSeniorCitizenRows = async () => {
    const [rows] = await pool.query(`
        SELECT
            per.person_id,
            CONCAT(
                per.last_name, ', ', per.first_name,
                IF(per.middle_name IS NOT NULL AND per.middle_name != '', CONCAT(' ', per.middle_name), ''),
                IF(per.suffix     IS NOT NULL AND per.suffix     != '', CONCAT(' ', per.suffix),     '')
            ) AS full_name,
            per.birth_date,
            TIMESTAMPDIFF(YEAR, per.birth_date, CURDATE()) AS age,
            r.isActive,
            COALESCE(
                GROUP_CONCAT(
                    DISTINCT CONCAT('Lot ', p.lot_number, ' ', p.street_name)
                    ORDER BY p.street_name
                    SEPARATOR '; '
                ),
                '—'
            ) AS address,
            CASE
                WHEN TIMESTAMPDIFF(YEAR, per.birth_date, CURDATE()) >= 60 AND r.isActive = 1 THEN 'active_senior'
                WHEN TIMESTAMPDIFF(YEAR, per.birth_date, CURDATE()) >= 60 AND r.isActive = 0 THEN 'inactive_senior'
                ELSE 'turning_60'
            END AS category
        FROM Person per
        JOIN Resident r ON per.person_id = r.person_id
        LEFT JOIN Resident_Property rp ON r.resident_id = rp.resident_id
        LEFT JOIN Property p ON rp.property_id = p.property_id
        WHERE per.birth_date IS NOT NULL
          AND (
              TIMESTAMPDIFF(YEAR, per.birth_date, CURDATE()) >= 60
              OR (
                  TIMESTAMPDIFF(YEAR, per.birth_date, CURDATE()) < 60
                  AND DATE_ADD(per.birth_date, INTERVAL 60 YEAR)
                      BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
              )
          )
        GROUP BY per.person_id, per.first_name, per.last_name,
                 per.middle_name, per.suffix, per.birth_date, r.isActive
        ORDER BY per.last_name, per.first_name
    `);
    return rows;
};

const getSeniorCitizenSummary = async (rows) => {
    const active   = rows.filter(r => r.category === 'active_senior');
    const inactive = rows.filter(r => r.category === 'inactive_senior');
    const turning  = rows.filter(r => r.category === 'turning_60');
    return {
        totalSeniors:   active.length + inactive.length,
        activeCount:    active.length,
        inactiveCount:  inactive.length,
        turningCount:   turning.length,
    };
};

const getVillageGeneralReport = async (fromDate, toDate) => {
    const [[propStats]] = await pool.query(`
        SELECT
            COUNT(*)                                                  AS total_properties,
            COUNT(CASE WHEN property_type = 'House' THEN 1 END)      AS house_count,
            COUNT(CASE WHEN property_type = 'Lot'   THEN 1 END)      AS lot_count,
            COUNT(CASE WHEN hasDues = 1              THEN 1 END)      AS delinquent_count
        FROM Property
    `);

    const [[residentStats]] = await pool.query(`
        SELECT
            COUNT(DISTINCT r.resident_id)                                                          AS total_active,
            COUNT(DISTINCT CASE WHEN rp.type = 'Homeowner' THEN r.resident_id END)                AS homeowner_count,
            COUNT(DISTINCT CASE WHEN rp.type = 'Tenant'    THEN r.resident_id END)                AS tenant_count
        FROM Resident r
        LEFT JOIN Resident_Property rp ON r.resident_id = rp.resident_id
        WHERE r.deleteFlag = 0
          AND r.residency_start_date <= ?
          AND (r.residency_end_date IS NULL OR r.residency_end_date >= ?)
    `, [toDate, fromDate]);

    const [boardMembers] = await pool.query(`
        SELECT
            bm.position,
            bm.board_start_date,
            CONCAT(p.last_name, ', ', p.first_name) AS full_name,
            p.contact_num,
            p.email
        FROM Board_Member bm
        JOIN Resident r ON bm.resident_id = r.resident_id
        JOIN Person   p ON r.person_id    = p.person_id
        WHERE bm.board_end_date IS NULL
        ORDER BY bm.position, p.last_name
    `);

    const [employees] = await pool.query(`
        SELECT
            e.position,
            e.employee_start_date,
            e.employee_end_date,
            CONCAT(p.last_name, ', ', p.first_name) AS full_name,
            p.contact_num,
            p.email
        FROM Employee e
        JOIN Person p ON e.person_id = p.person_id
        WHERE e.employee_start_date <= ?
          AND (e.employee_end_date IS NULL OR e.employee_end_date >= ?)
        ORDER BY e.position, p.last_name
    `, [toDate, fromDate]);

    const [[vehicleStats]] = await pool.query(`
        SELECT COUNT(*) AS total_active FROM Vehicle WHERE status = 'Active'
    `);

    return {
        properties: {
            total:      propStats.total_properties,
            houseCount: propStats.house_count,
            lotCount:   propStats.lot_count,
            delinquent: propStats.delinquent_count,
        },
        residents: {
            totalActive:    residentStats.total_active,
            homeownerCount: residentStats.homeowner_count,
            tenantCount:    residentStats.tenant_count,
        },
        vehicles: {
            totalActive: vehicleStats.total_active,
        },
        boardMembers,
        employees,
    };
};

const COLLECTION_PURPOSES = ['Association Dues', 'Vehicle Sticker', 'Outstanding Balance', 'General Payments'];
const EXPENSE_PURPOSES    = ['Utilities', 'Employee Salaries', 'Maintenance', 'Petty Cash', 'Food', 'Community Project', 'Other'];

const getFinancialsReport = async (fromDate, toDate) => {
    const collectionPlaceholders = COLLECTION_PURPOSES.map(() => '?').join(',');
    const expensePlaceholders    = EXPENSE_PURPOSES.map(() => '?').join(',');

    const [collectionRows] = await pool.query(`
        SELECT purpose, COALESCE(SUM(amount_paid), 0) AS total
        FROM Payment
        WHERE date_paid BETWEEN ? AND ?
          AND purpose IN (${collectionPlaceholders})
        GROUP BY purpose
    `, [fromDate, toDate, ...COLLECTION_PURPOSES]);

    const [expenseRows] = await pool.query(`
        SELECT purpose, COALESCE(SUM(amount_paid), 0) AS total
        FROM Payment
        WHERE date_paid BETWEEN ? AND ?
          AND purpose IN (${expensePlaceholders})
        GROUP BY purpose
    `, [fromDate, toDate, ...EXPENSE_PURPOSES]);

    const collectionMap = Object.fromEntries(COLLECTION_PURPOSES.map(p => [p, 0]));
    const expenseMap    = Object.fromEntries(EXPENSE_PURPOSES.map(p => [p, 0]));
    collectionRows.forEach(r => { collectionMap[r.purpose] = parseFloat(r.total); });
    expenseRows.forEach(r => {    expenseMap[r.purpose]    = parseFloat(r.total); });

    const collections      = COLLECTION_PURPOSES.map(p => ({ purpose: p, total: collectionMap[p] }));
    const expenses         = EXPENSE_PURPOSES.map(p => ({ purpose: p, total: expenseMap[p] }));
    const totalCollections = collections.reduce((s, r) => s + r.total, 0);
    const totalExpenses    = expenses.reduce((s, r) => s + r.total, 0);
    const endingBalance    = totalCollections - totalExpenses;

    const [monthlyRows] = await pool.query(`
        SELECT
            YEAR(date_paid)  AS year_num,
            MONTH(date_paid) AS month_num,
            COALESCE(SUM(CASE WHEN purpose IN (${collectionPlaceholders}) THEN amount_paid ELSE 0 END), 0) AS collections,
            COALESCE(SUM(CASE WHEN purpose IN (${expensePlaceholders})    THEN amount_paid ELSE 0 END), 0) AS expenses
        FROM Payment
        WHERE date_paid BETWEEN ? AND ?
        GROUP BY YEAR(date_paid), MONTH(date_paid)
        ORDER BY YEAR(date_paid), MONTH(date_paid)
    `, [...COLLECTION_PURPOSES, ...EXPENSE_PURPOSES, fromDate, toDate]);

    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dataMap = {};
    monthlyRows.forEach(r => { dataMap[`${r.year_num}-${r.month_num}`] = r; });

    // Generate every month slot in the range (including empty ones)
    const monthly = [];
    let [y, m] = fromDate.split('-').map(Number);
    const [toY, toM] = toDate.split('-').map(Number);
    while (y < toY || (y === toY && m <= toM)) {
        const row = dataMap[`${y}-${m}`] || { collections: 0, expenses: 0 };
        monthly.push({
            label:       `${MONTH_NAMES[m - 1]} ${y}`,
            collections: parseFloat(row.collections),
            expenses:    parseFloat(row.expenses),
        });
        if (++m > 12) { m = 1; y++; }
    }

    return { collections, expenses, totalCollections, totalExpenses, endingBalance, monthly };
};

module.exports = {
    getDelinquencyReportSummary,
    getDelinquencyReportRows,
    getSeniorCitizenRows,
    getSeniorCitizenSummary,
    getVillageGeneralReport,
    getFinancialsReport,
};
