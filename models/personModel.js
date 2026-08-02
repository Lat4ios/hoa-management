const db = require('../config/db');

/**
 * Fetches a person record given its id.
 *
 * @param {number} person_id
 * @param {*} conn
 * @returns {Object}
 */
const selectPersonById = async (person_id, conn) => {

    const [rows] = await conn.query(`
        SELECT
            person_id,
            first_name,
            middle_name,
            last_name,
            suffix,
            birth_date,
            email,
            contact_num
        FROM Person
        WHERE person_id = ?`,
        [person_id]
    );

    return rows[0];
};

/**
 * Fetches a person record given their identifying information.
 *
 * @param {string} first_name
 * @param {string} last_name
 * @param {string} contact_num
 * @param {*} conn
 * @returns {Object}
 */
const selectPersonByName = async (data, conn) => {
    const [rows] = await conn.query(
        `
        SELECT person_id
        FROM Person
        WHERE first_name = ?
          AND middle_name <=> ?
          AND last_name = ?
          AND suffix <=> ?
        `,
        [
            data.first_name,
            data.middle_name || null,
            data.last_name,
            data.suffix || null
        ]
    );

    return rows[0];
};

/**
 * Fetches all person records.
 *
 * @param {*} conn
 * @returns {Array}
 */
const getAllPersons = async (conn) => {

    const [rows] = await conn.query(`
        SELECT
            person_id,
            first_name,
            middle_name,
            last_name,
            suffix,
            birth_date,
            email,
            contact_num
        FROM Person`
    );

    return rows;
};

/**
 * Inserts a new person.
 *
 * @param {*} data
 * @param {*} conn
 * @returns {number}
 */
const addPerson = async (data, conn) => {

    const [result] = await conn.query(`
        INSERT INTO Person (
            first_name,
            middle_name,
            last_name,
            suffix,
            birth_date,
            email,
            contact_num
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.first_name,
            data.middle_name || null,
            data.last_name,
            data.suffix || null,
            data.birth_date || null,
            data.email || null,
            data.contact_num || null
        ]
    );

    return result.insertId;
};

/**
 * Deletes a person by id.
 *
 * @param {number} person_id
 * @param {*} conn
 * @returns {number}
 */
const deletePerson = async (person_id, conn) => {

    const [result] = await conn.query(`
        DELETE FROM Person
        WHERE person_id = ?`,
        [person_id]
    );

    return result.affectedRows;
};

/**
 * Updates an existing person.
 *
 * @param {*} data
 * @param {number} person_id
 * @param {*} conn
 * @returns {number}
 */
const updatePerson = async (data, person_id, conn) => {

    const [result] = await conn.query(`
        UPDATE Person
        SET
            first_name = ?,
            middle_name = ?,
            last_name = ?,
            suffix = ?,
            email = ?,
            contact_num = ?,
            birth_date = ?
        WHERE person_id = ?`,
        [
            data.first_name,
            data.middle_name || null,
            data.last_name,
            data.suffix || null,
            data.email || null,
            data.contact_num || null,
            data.birth_date || null,
            person_id
        ]
    );

    return result.affectedRows;
};

module.exports = {
    selectPersonById,
    selectPersonByName,
    getAllPersons,
    addPerson,
    updatePerson,
    deletePerson
};

