const express              = require('express');
const router               = express.Router();
const PaymentController    = require('../controllers/paymentController');
const paymentLedgerModel   = require('../models/paymentLedgerModel');
const propertyModel        = require('../models/propertyModel');
const VehicleModel         = require('../models/vehicleModel');
const rateModel            = require('../models/rateModel');

const STICKER_CATEGORIES = ['Car', 'Car (More than 6 stickers)', 'Motorcycle', 'Commercial'];

const PURPOSE_MAP = {
    association: 'Association Dues',
    vehicle:     'Vehicle Sticker',
    outstanding: 'Outstanding Balance',
    general:     'General Payments',
};

router.get('/', PaymentController.getPaymentDashboard);

router.get('/:type', async (req, res) => {
    const type = req.params.type;
    if (!PURPOSE_MAP[type]) return res.redirect('/payments');

    try {
        const persons    = await paymentLedgerModel.getAllPersons();
        const properties = (type === 'association' || type === 'outstanding')
            ? await propertyModel.selectAllProperties()
            : [];
        const vehicles   = (type === 'vehicle' || type === 'association')
            ? await VehicleModel.getAllVehicles()
            : [];
        const residentsByProperty = (type === 'association' || type === 'outstanding')
            ? await paymentLedgerModel.getResidentsByProperty()
            : {};
        const allRates       = type === 'association' ? await rateModel.getActiveRates() : [];
        const stickerRates   = allRates.filter(r => STICKER_CATEGORIES.includes(r.rate_category));

        res.render('payments', {
            title:       'Payments',
            activePage:  'payments',
            pageCSS:     'payments.css',
            paymentType: type,
            purposeValue: PURPOSE_MAP[type],
            persons,
            properties,
            vehicles,
            residentsByProperty,
            stickerRates,
            preselectedPropertyId: req.query.property_id ? parseInt(req.query.property_id) : null,
            preselectedPersonId:   req.query.person_id   ? parseInt(req.query.person_id)   : null,
        });
    } catch (err) {
        console.error('Payment form error:', err);
        res.status(500).send('Failed to load payment form.');
    }
});

module.exports = router;
