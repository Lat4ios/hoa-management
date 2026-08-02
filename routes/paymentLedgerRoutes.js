const express = require('express');
const router  = express.Router();
const paymentLedgerController = require('../controllers/paymentLedgerController');

router.get('/',        paymentLedgerController.getPayments);
router.post('/',       paymentLedgerController.createPayment);
router.post('/update', paymentLedgerController.updatePayment);
router.delete('/:id',  paymentLedgerController.deletePayment);

module.exports = router;
