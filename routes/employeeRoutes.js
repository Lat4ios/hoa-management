const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');

// READ
router.get('/', employeeController.getEmployees);

// CREATE
router.post('/', employeeController.createEmployee);

// UPDATE
router.post('/update', employeeController.updateEmployee);

// DELETE
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;