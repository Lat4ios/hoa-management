const employeeModel = require('../models/employeeModel');
const employeeService = require('../services/employeeService');

const getEmployees = async (req, res) => {
    try {
        const employees = await employeeModel.getAllEmployees();
        return res.render('employees', {
            title:      'Employees',
            activePage: 'employees',
            pageCSS:    'employees.css',
            employees,
            success: req.query.success || null,
            error:   req.query.error   || null,
        });
    } catch (err) {
        console.error('Error fetching employees:', err);
        return res.status(500).send('Failed to load employees');
    }
};

const createEmployee = async (req, res) => {
    try {
        await employeeService.addEmployee(req.body);
        return res.redirect('/employees?success=Employee+added+successfully.');
    } catch (err) {
        console.error(err);
        return res.redirect(`/employees?error=${encodeURIComponent(err.message)}`);
    }
};

const updateEmployee = async (req, res) => {
    try {
        await employeeService.updateEmployee(req.body);
        return res.redirect('/employees?success=Employee+updated+successfully.');
    } catch (err) {
        console.error(err);
        return res.redirect(`/employees?error=${encodeURIComponent(err.message)}`);
    }
};

const deleteEmployee = async (req, res) => {
    try {
        await employeeService.deleteEmployee(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
