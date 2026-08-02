const expenseModel = require('../models/expenseModel');

const getExpenseDashboard = async (req, res) => {
    try {
        res.render('expenses', {
            title: 'Expenses',
            activePage: 'expenses',
            pageCSS: 'expenses.css',
            expenseType: 'other',
            purposeValue: 'Other',
            expenses: [] 
        });
    } catch (err) {
        console.error('getExpenses error:', err);
        res.status(500).send('Failed to load expenses.');
    }
};

const createExpense = async (req, res) => {
    try {
        // if employee salary expense, the name of the employee is appended to the remarks part
        if (req.body.employee_name) {
            const salaryNote = `Salary paid to: ${req.body.employee_name}`;
            
            // append other remarks that were typed in
            req.body.remarks = req.body.remarks 
                ? `${salaryNote} | ${req.body.remarks}` 
                : salaryNote;
        }

        const { 
            purpose, payor_id, payor_type, 
            amount_expected, amount_paid, 
            date_paid, payment_method, 
            receipt_number, remarks 
        } = req.body;

        const inputDate = date_paid;
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        if (inputDate > today) {
            return res.redirect('/payments?error=Date+paid+cannot+be+a+future+date');
        }

        const dbCategory = purpose ? purpose.toLowerCase() : 'other';

        await expenseModel.createExpense({
            category: dbCategory,
            payor_id: payor_id || 1, 
            payor_type: payor_type || 'Resident', 
            amount_expected: amount_expected || 0.00,
            amount_paid: amount_paid,
            date_paid: date_paid,
            payment_method: payment_method,
            receipt_number: receipt_number,
            remarks: req.body.remarks
        });
        
        res.redirect('/payments?success=Expense+recorded+successfully');
        
    }
    catch (error) {
        console.error("Error creating expense:", error);
        res.redirect('/payments?error=Failed+to+save+expense');
    }
};

const updateExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const { date_paid } = req.body;

        if (date_paid) {
            const inputDate = date_paid;
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            if (inputDate > today) {
                return res.json({ success: false, message: "Date paid cannot be a future date." });
            }
        }

        await expenseModel.updateExpense(expenseId, req.body);
        res.json({ success: true, message: "Expense updated successfully!" });
    }
    catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ success: false, message: "Failed to update expense." });
    }
};

const deleteExpense = async (req, res) => {
    try {
        await expenseModel.deleteExpense(req.params.id);
        res.json({ success: true, message: "Expense deleted successfully!" });
    }
    catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ success: false, message: "Failed to delete expense." });
    }
};

module.exports = {
    getExpenseDashboard,
    createExpense,
    updateExpense,
    deleteExpense
};