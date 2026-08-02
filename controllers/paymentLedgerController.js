const paymentLedgerModel   = require('../models/paymentLedgerModel');
const paymentLedgerService = require('../services/paymentLedgerService');
const expenseModel = require('../models/expenseModel');

const getPayments = async (req, res) => {
    try {
        const { purpose } = req.query;
        const payments = purpose
            ? await paymentLedgerModel.getPaymentsByPurpose(purpose)
            : await paymentLedgerModel.getAllPayments();
        const persons = await paymentLedgerModel.getAllPersons();
        const expenses = await expenseModel.getAllExpenses();

        res.render('paymentLedger', {
            title:         'Payment Ledger',
            activePage:    'paymentLedger',
            pageCSS:       'payment-ledger.css',
            payments,
            persons,
            expenses,
            filterPurpose: purpose || '',
            success:       req.query.success || null,
            error:         req.query.error   || null,
        });

    } catch (err) {
        console.error('getPayments error:', err);
        res.status(500).send('Failed to load payments.');
    }
};

const createPayment = async (req, res) => {
    try {
        const inputDate = req.body.date_paid;
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

        // to validate that payment date is not in the future
        if (inputDate && inputDate > today) {
            return res.redirect('/payments?error=Date+paid+cannot+be+in+the+future');
        }

        const purposeStr = req.body.purpose ? req.body.purpose.toLowerCase() : '';
        
        if (purposeStr.includes('general')) {
            
            const subtypeMap = {
                'basketball_rental': 'Basketball Court Rental',
                'racquet_rental': 'Racquet Court Rental',
                'football_rental': 'Football Field Rental',
                'clubhouse_rental': 'Clubhouse Rental',
                'tables_rental': 'Tables and Chairs Rental',
                'endorsement_letter': 'Endorsement Letter',
                'construction_fee': 'Construction Fee',
                'construction_bond': 'Construction Bond',
                'renovation_fee': 'Renovation Fee',
                'penalty': 'Penalty',
                'donation': 'Donation',
                'bulletin_fee': 'Bulletin Board Fee',
                'other': 'Other'
            };

            const rawSubType = req.body.payment_subtype;
            const remark = subtypeMap[rawSubType] || 'General Payment';
            const rawName = (req.body.payer_name_text || '').trim();
            const originalRemarks = (req.body.remarks || '').trim();
            
            let finalRemarks = remark;
            
            if (!req.body.paid_by) {
                req.body.paid_by = null;
                if (rawName) {
                    finalRemarks += ` (Non-resident Payer: ${rawName})`;
                }
            }

            if (originalRemarks) {
                finalRemarks += ` — ${originalRemarks}`;
            }
            
            req.body.remarks = finalRemarks;
            req.body.purpose = 'General Payments';
        }

        await paymentLedgerService.addPayment(req.body);
        res.redirect('/payments?success=Payment+added+successfully.');
        
    } catch (err) {
        console.error('createPayment error:', err);
        res.redirect(`/payments?error=${encodeURIComponent(err.message)}`);
    }
};

const updatePayment = async (req, res) => {
    try {
        if (req.body.date_paid) {
            const inputDate = req.body.date_paid;
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
            
            if (inputDate > today) {
                return res.redirect('/payments?error=Edited+date+cannot+be+in+the+future');
            }
        }
        
        const { payment_id, ...data } = req.body;
        await paymentLedgerService.updatePayment(payment_id, data);
        res.redirect('/payments?success=Payment+updated+successfully.');
    } catch (err) {
        console.error('updatePayment error:', err);
        res.redirect(`/payments?error=${encodeURIComponent(err.message)}`);
    }
};

const deletePayment = async (req, res) => {
    try {
        await paymentLedgerService.deletePayment(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('deletePayment error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
