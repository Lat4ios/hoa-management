const { pool } = require("../config/db");

const personModel = require("../models/personModel");
const employeeModel = require("../models/employeeModel");

/**
 * Creates a new employee.
 *
 * Creates the corresponding Person record first,
 * then creates the Employee record.
 */
const addEmployee = async (data) => {

    const conn = await pool.getConnection();

    try {

        await conn.beginTransaction();

        // Check if the person already exists
        const duplicatePerson = await personModel.selectPersonByName(
            data,
            conn
        );

        if (duplicatePerson != null) {
            throw new Error("This employee already exists!");
        }

        // Create the Person record
        const person_id = await personModel.addPerson(data, conn);

        if (!person_id) {
            throw new Error("Failed to create Person record.");
        }

        // Create the Employee record
        const employee_id = await employeeModel.addEmployee(
            data,
            person_id,
            conn
        );

        if (!employee_id) {
            throw new Error("Failed to create Employee record.");
        }

        await conn.commit();

        return employee_id;

    } catch (err) {

        await conn.rollback();
        throw err;

    } finally {

        conn.release();

    }

};

/**
 * Updates an existing employee.
 */
const updateEmployee = async (data) => {

    const conn = await pool.getConnection();

    try {

        await conn.beginTransaction();

        // Verify employee exists
        const existingEmployee =
            await employeeModel.selectPersonByEmployeeId(
                data.employee_id,
                conn
            );

        if (existingEmployee == null) {
            throw new Error("Employee does not exist!");
        }

        // Update Person table
        await personModel.updatePerson(
            data,
            existingEmployee.person_id,
            conn
        );

        // Update Employee table
        await employeeModel.updateEmployee(
            data,
            conn
        );

        await conn.commit();

    } catch (err) {

        await conn.rollback();
        throw err;

    } finally {

        conn.release();

    }

};

/**
 * Deletes an employee.
 *
 * Since Employee.person_id has ON DELETE CASCADE,
 * deleting the Person record will automatically
 * delete the Employee record.
 */
const deleteEmployee = async (employee_id) => {

    const conn = await pool.getConnection();

    try {

        await conn.beginTransaction();

        const existingEmployee =
            await employeeModel.selectPersonByEmployeeId(
                employee_id,
                conn
            );

        if (existingEmployee == null) {
            throw new Error("Employee does not exist!");
        }

        await personModel.deletePerson(
            existingEmployee.person_id,
            conn
        );

        await conn.commit();

    } catch (err) {

        await conn.rollback();
        throw err;

    } finally {

        conn.release();

    }

};

module.exports = {
    addEmployee,
    updateEmployee,
    deleteEmployee
};