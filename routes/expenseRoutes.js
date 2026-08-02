const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

const paymentLedgerModel = require('../models/paymentLedgerModel');

const PURPOSE_MAP = {
    utilities: 'Utilities',
    salaries: 'Employee Salaries',
    maintenance: 'Maintenance',
    cash: 'Petty Cash',
    food: 'Food',
    project: 'Community Project', 
    other: 'Other',
};

router.get('/', expenseController.getExpenseDashboard);

router.get('/:type', async (req, res) => {
    const type = req.params.type;
    if (!PURPOSE_MAP[type]) return res.redirect('/expenses');

    try {

        const persons = await paymentLedgerModel.getAllPersons();

        console.log("People fetched from DB:", persons);

        res.render('expenses', {
            title:       'Expenses',
            activePage:  'expenses',
            pageCSS:     'expenses.css',
            expenseType: type,
            purposeValue: PURPOSE_MAP[type],
            persons: persons
        });
    }
    catch (err) {
        console.error('Expense form error:', err);
        
        res.render('expenses', {
            title:       'Expenses',
            activePage:  'expenses',
            pageCSS:     'expenses.css',
            expenseType: type,
            purposeValue: PURPOSE_MAP[type],
            persons: [] 
        });
    }
});

router.post('/', expenseController.createExpense);
router.post('/update/:id', expenseController.updateExpense);
router.post('/delete/:id', expenseController.deleteExpense);

module.exports = router;