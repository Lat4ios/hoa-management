const db = require('../config/db');
const pool = db.pool;

/**
 * Fetches a resident record given its id
 * 
 * @param {*} resident_id 
 * @returns - the resident record
 */
const selectResidentById = async(resident_id, conn) => {
    const [rows] = await pool.query(`
            SELECT 
                resident_id,
                residency_start_date,
                residency_end_date,
                person_id
            FROM Resident WHERE resident_id = ?`,
            [resident_id]
    );
    return rows[0];
};

const selectPersonByResidentId = async(resident_id, conn) => {

    const[rows] = await conn.query(`
        SELECT person_id
        FROM Resident
        WHERE resident_id = ?`,
        [resident_id]
    );

    return rows[0];
}


/**
 * Fetches all records in the Resident table
 * 
 * @returns - All the resident records
 */
const getAllResidents = async() => {
    const [rows] = await pool.query(`
        SELECT
            Resident.resident_id,
            Person.person_id,
            Person.first_name,
            Person.middle_name,
            Person.suffix,
            Person.last_name,
            Person.birth_date,
            Person.email,
            Person.contact_num,
            Resident.residency_start_date,
            Resident.residency_end_date,
            Resident.isActive,
            Resident.isDelinquent
        FROM Resident
        JOIN Person
            ON Resident.person_id = Person.person_id
        WHERE deleteFlag = 0
        ORDER BY Resident.isActive DESC`
    );

    return rows;
};

const findActiveResidentByPersonId = async (person_id, conn) => {
    const [rows] = await conn.query(
        `
        SELECT resident_id
        FROM Resident
        WHERE person_id = ?
          AND isActive = 1
          AND deleteFlag = 0
        `,
        [person_id]
    );

    return rows[0];
};
/**
 * Adds a new resident record to the Resident table
 * 
 * @param {*} data - Resident data
 * @returns - The generated resident_id
 */
const addResident = async(data, person_id, conn) => {
    const [result] = await conn.query(`
        INSERT INTO Resident (person_id, residency_start_date)
        VALUES(?, ?)`,
        [
            person_id,
            data.residency_start_date
        ]
    );

    return result.insertId;
};

/**
 * Deletes an existing resident record from the Resident table
 * 
 * @param {*} resident_id - The resident to be deleted
 * @returns - The number of rows deleted
 */
const deleteResident = async(resident_id, conn) => {
    const [result] = await conn.query(`
       UPDATE Resident
       SET deleteFlag = 1
       WHERE resident_id = ?`,
       [resident_id]
    );
    //if i delete a resident that means i should also delete its 
    return result.affectedRows;
};
/**
 * Deactivates an existing resident, meaning their residency has ended.
 * This function sets the residency end date and sets the isActive property
 * to false
 * 
 * @param {*} resident_id - The resident to be deleted
 * @returns - The number of rows deleted
 */
const deactivateResident = async(resident_id, end_date, conn) => {
   
     const [result] = await conn.query(`
        UPDATE Resident
        SET residency_end_date = ?, isActive = 0
        WHERE resident_id = ?`,
        [
            end_date,
            resident_id
        ]
    );

    return result.affectedRows;

}

/**
 * Updates data from an existing resident record in the Resident table
 * 
 * @param {*} data - Resident data to update
 * @returns - The number of rows updated
 */
const updateResident = async(start_date, resident_id, conn) => {

    const [result] = await conn.query(`
        UPDATE Resident
        SET residency_start_date = ?
        WHERE resident_id = ?`,
        [
            start_date,
            resident_id
        ]
    );

    return result.affectedRows;
};


const setDelinquent = async (residentId, value, conn) => {
    await conn.query(
        `UPDATE Resident SET isDelinquent = ? WHERE resident_id = ?`,
        [value ? 1 : 0, residentId]
    );
};

const getResidentIdByPersonId = async (personId, conn) => {
    const db = conn || pool;
    const [rows] = await db.query(
        `SELECT resident_id FROM Resident WHERE person_id = ? AND deleteFlag = 0 ORDER BY isActive DESC LIMIT 1`,
        [personId]
    );
    return rows[0] || null;
};

const getDelinquentPropertiesByResidentId = async (residentId) => {
    const [rows] = await pool.query(`
        SELECT p.property_id, p.lot_number, p.street_name, p.property_type, p.outstandingBalance
        FROM Resident_Property rp
        JOIN Property p ON rp.property_id = p.property_id
        WHERE rp.resident_id = ? AND p.hasDues = 1 AND p.outstandingBalance > 0
        ORDER BY p.street_name, p.lot_number
    `, [residentId]);
    return rows;
};

module.exports = {
    selectResidentById,
    selectPersonByResidentId,
    getAllResidents,
    addResident,
    deleteResident,
    updateResident,
    deactivateResident,
    findActiveResidentByPersonId,
    setDelinquent,
    getResidentIdByPersonId,
    getDelinquentPropertiesByResidentId,
};

