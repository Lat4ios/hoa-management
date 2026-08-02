const { pool }       = require('../config/db');
const propertyModel  = require('../models/propertyModel');
const rateModel      = require('../models/rateModel');

// Property.property_type + monthly/annual -> Rates.rate_category
const RATE_CATEGORY = {
    House:   { monthly: 'House (Monthly Payment)', annual: 'House (Annual Payment)' },
    Lot:     { monthly: 'Lot (Monthly Payment)',    annual: 'Lot (Annual Payment)'   },
};

// Resolves the Association Dues rate for a property. Read-only.
// paymentType: 'monthly' | 'annual'. months: 1-11, required (and only used) for monthly.
// Returns { property, isAnnual, rateCategory, unitRate, months, amount }
const resolveAssociationDuesRate = async (propertyId, paymentType, months, conn = pool) => {
    if (!propertyId) {
        throw new Error('A property must be selected.');
    }
    const property = await propertyModel.getPropertyById(propertyId, conn);
    if (!property) {
        throw new Error('Selected property was not found.');
    }

    const isAnnual = paymentType === 'annual';
    const categoryMap = RATE_CATEGORY[property.property_type];
    if (!categoryMap) {
        throw new Error(`No rate is configured for property type "${property.property_type}".`);
    }
    const rateCategory = isAnnual ? categoryMap.annual : categoryMap.monthly;

    let monthsCount = 1;
    if (!isAnnual) {
        monthsCount = parseInt(months, 10);
        if (!monthsCount || monthsCount < 1 || monthsCount > 11) {
            throw new Error('Months must be between 1 and 11 for a monthly payment.');
        }
    }

    const rate = await rateModel.getRateByCategory(rateCategory, conn);
    if (!rate) {
        throw new Error(`Rate category "${rateCategory}" is not set up in Rates.`);
    }

    const unitRate = parseFloat(rate.amount);
    const raw      = isAnnual ? unitRate : unitRate * monthsCount;
    const amount   = Math.round(raw * 100) / 100;

    return {
        property,
        isAnnual,
        rateCategory,
        unitRate,
        months: isAnnual ? null : monthsCount,
        amount,
    };
};

module.exports = { resolveAssociationDuesRate };
