const propertyService = require('../services/propertyService');
const associationDuesRateService = require('../services/associationDuesRateService');

// ── GET /properties ──────────────────────────────────────────────────────────
exports.getProperties = async (req, res) => {
    try {
        const [properties, residents] = await Promise.all([
            propertyService.getAllProperties(),
            propertyService.getAllResidents(),
        ]);

        res.render('property', {
            title:      'Properties',
            activePage: 'properties',
            pageCSS:    'property.css',
            properties,
            residents,
            success: req.query.success || null,
            error:   req.query.error   || null,
        });
    } catch (err) {
        console.error('getProperties error:', err);
        res.status(500).send('Failed to load properties.');
    }
};

// ── GET /properties/:id/residents  (JSON) ────────────────────────────────────
exports.getPropertyResidents = async (req, res) => {
    try {
        const residents = await propertyService.getPropertyResidents(req.params.id);
        res.json(residents);
    } catch (err) {
        console.error('getPropertyResidents error:', err);
        res.status(500).json({ error: 'Failed to load residents.' });
    }
};

// ── GET /properties/:id/association-dues-estimate?payment_type=&months=  (JSON) ──
// Read-only estimate shown on the payment form before submission (AC 3).
// The Association Dues payment itself re-computes this server-side on submit,
// so this endpoint is for display purposes only and is not the source of truth.
exports.getAssociationDuesEstimate = async (req, res) => {
    try {
        const { payment_type, months } = req.query;
        const resolved = await associationDuesRateService.resolveAssociationDuesRate(
            req.params.id, payment_type, months
        );
        res.json({
            success: true,
            amount: resolved.amount,
            rateCategory: resolved.rateCategory,
            unitRate: resolved.unitRate,
            isAnnual: resolved.isAnnual,
            propertyType: resolved.property.property_type,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ── POST /properties ─────────────────────────────────────────────────────────
exports.createProperty = async (req, res) => {
    try {
        const { lot_number, property_type, street_name, resident_ids, resident_types } = req.body;

        const ids   = [].concat(resident_ids   || []);
        const types = [].concat(resident_types || []);

        await propertyService.createProperty({
            lot_number, property_type, street_name,
            resident_ids: ids, resident_types: types,
        });
        res.redirect('/properties?success=Property+added+successfully.');
    } catch (err) {
        console.error('createProperty error:', err);
        res.redirect(`/properties?error=${encodeURIComponent(err.message)}`);
    }
};

// ── POST /properties/:id/update ──────────────────────────────────────────────
exports.updateProperty = async (req, res) => {
    try {
        const { lot_number, property_type, street_name, resident_ids, resident_types } = req.body;

        const ids   = [].concat(resident_ids   || []);
        const types = [].concat(resident_types || []);

        await propertyService.updateProperty({
            property_id: req.params.id,
            lot_number, property_type, street_name,
            resident_ids: ids, resident_types: types,
        });
        res.redirect('/properties?success=Property+updated+successfully.');
    } catch (err) {
        console.error('updateProperty error:', err);
        res.redirect('/properties?error=Failed+to+update+property.');
    }
};

// ── POST /properties/:id/delete ──────────────────────────────────────────────
exports.deleteProperty = async (req, res) => {
    try {
        await propertyService.deleteProperty(req.params.id);
        res.redirect('/properties?success=Property+deleted+successfully.');
    } catch (err) {
        console.error('deleteProperty error:', err);
        res.redirect('/properties?error=Failed+to+delete+property.');
    }
};

// ── POST /properties/:id/outstanding-balance ─────────────────────────────────
exports.setOutstandingBalance = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount) || 0;
        await propertyService.setOutstandingBalance(req.params.id, amount);
        res.redirect('/properties?success=Outstanding+balance+updated.');
    } catch (err) {
        console.error('setOutstandingBalance error:', err);
        res.redirect('/properties?error=Failed+to+update+outstanding+balance.');
    }
};
