const db = require('../config/db');
const pool = db.pool;

/**
 * Fetches an employee record given its id.
 *
 * @param {*} employee_id
 * @returns the employee record
 */
const selectEmployeeById = async (employee_id, conn) => {

    const [rows] = await conn.query(`
        SELECT
            employee_id,
            salary,
            position,
            employee_start_date,
            employee_end_date,
            person_id
        FROM Employee
        WHERE employee_id = ?`,
        [employee_id]
    );

    return rows[0];
};

/**
 * Fetches the person_id associated with an employee.
 *
 * @param {*} employee_id
 * @returns person_id
 */
const selectPersonByEmployeeId = async (employee_id, conn) => {

    const [rows] = await conn.query(`
        SELECT
            person_id
        FROM Employee
        WHERE employee_id = ?`,
        [employee_id]
    );

    return rows[0];
};

/**
 * Fetches all employees together with their personal information.
 *
 * @returns all employee records
 */
const getAllEmployees = async () => {

    const [rows] = await pool.query(`
        SELECT
            e.employee_id,
            e.person_id,

            p.first_name,
            p.middle_name,
            p.last_name,
            p.suffix,

            p.email,
            p.contact_num,
            e.position,
            e.salary
        FROM Employee e
        JOIN Person p ON e.person_id = p.person_id
    `);

    return rows;
};

/**
 * Adds a new employee.
 *
 * @param {*} data
 * @param {*} person_id
 * @param {*} conn
 * @returns generated employee_id
 */
const addEmployee = async (data, person_id, conn) => {

    const [result] = await conn.query(`
        INSERT INTO Employee
        (
            salary,
            position,
            employee_start_date,
            employee_end_date,
            person_id
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
            data.salary,
            data.position,
            data.employee_start_date,
            data.employee_end_date || null,
            person_id
        ]
    );

    return result.insertId;
};

/**
 * Updates an employee.
 *
 * @param {*} data
 * @param {*} conn
 * @returns affected rows
 */
const updateEmployee = async (data, conn) => {

    const [result] = await conn.query(`
        UPDATE Employee
        SET
            salary = ?,
            position = ?,
            employee_start_date = ?,
            employee_end_date = ?
        WHERE employee_id = ?`,
        [
            data.salary,
            data.position,
            data.employee_start_date,
            data.employee_end_date || null,
            data.employee_id
        ]
    );

    return result.affectedRows;
};

/**
 * Deletes an employee.
 *
 * @param {*} employee_id
 * @param {*} conn
 * @returns affected rows
 */
const deleteEmployee = async (employee_id, conn) => {

    const [result] = await conn.query(`
        DELETE FROM Employee
        WHERE employee_id = ?`,
        [employee_id]
    );

    return result.affectedRows;
};

module.exports = {
    selectEmployeeById,
    selectPersonByEmployeeId,
    getAllEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
};