const { pool }      = require('../config/db');
const vehicleModel  = require('../models/vehicleModel');
const rateModel     = require('../models/rateModel');
const residentModel = require('../models/residentModel');

// Vehicle.type -> base Rates.rate_category. Car is the only type with a
// second (7th-sticker-and-beyond) tier; Motorcycle/Commercial always use
// their flat rate regardless of how many stickers the resident already has.
const VEHICLE_TYPE_RATE_CATEGORY = {
    Car:        'Car',
    Motorcycle: 'Motorcycle',
    Commercial: 'Commercial',
};

// Resolves the rate for EACH vehicle in vehicleIds, for the given payer
// (person_id), as one combined purchase. Read-only — does not create or
// modify anything.
//
// Car-type vehicles are priced incrementally within this same batch: if the
// resident already has `existingCount` Car stickers this year, the 1st Car
// in this batch is sticker #(existingCount + 1), the 2nd is #(existingCount + 2),
// etc. — so a single submission can span both the base and surged tier.
// Motorcycle/Commercial vehicles in the same batch always use their flat
// rate and do not affect or get affected by the Car count (AC 2.1 / 2.3).
//
// Returns { residentId, year, items: [{ vehicle, rateCategory, amount, stickerNumber }], totalAmount }
const resolveStickerRates = async (vehicleIds, personId, conn = pool) => {
    const ids = (Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds]).filter(Boolean);
    if (ids.length === 0) {
        throw new Error('At least one vehicle must be selected.');
    }

    const vehicles = await vehicleModel.getVehiclesByIds(ids, conn);
    if (vehicles.length !== ids.length) {
        throw new Error('One or more selected vehicles were not found.');
    }
    // preserve the order the vehicles were selected in
    const vehiclesById = new Map(vehicles.map(v => [String(v.vehicle_id), v]));
    const orderedVehicles = ids.map(id => vehiclesById.get(String(id)));

    let residentId = null;
    if (personId) {
        const r = await residentModel.getResidentIdByPersonId(personId, conn);
        if (r) residentId = r.resident_id;
    }

    const year = new Date().getFullYear();
    let existingCarCount = 0;
    if (residentId) {
        existingCarCount = await vehicleModel.countCarStickersForResident(residentId, year, ids, conn);
    }

    // Pre-fetch both Car rate tiers once, plus any flat rates actually needed.
    const rateCache = {};
    const getRate = async (category) => {
        if (!rateCache[category]) {
            const rate = await rateModel.getRateByCategory(category, conn);
            if (!rate) throw new Error(`Rate category "${category}" is not set up in Rates.`);
            rateCache[category] = rate;
        }
        return rateCache[category];
    };

    const items = [];
    let totalAmount = 0;
    let carsSeenInBatch = 0;

    for (const vehicle of orderedVehicles) {
        const baseCategory = VEHICLE_TYPE_RATE_CATEGORY[vehicle.type];
        if (!baseCategory) {
            throw new Error(`No rate is configured for vehicle type "${vehicle.type}".`);
        }

        let rateCategory = baseCategory;
        let stickerNumber = null;

        if (vehicle.type === 'Car') {
            carsSeenInBatch += 1;
            stickerNumber = existingCarCount + carsSeenInBatch;
            if (stickerNumber > 6) {
                rateCategory = 'Car (More than 6 stickers)';
            }
        }

        const rate = await getRate(rateCategory);
        items.push({
            vehicle,
            rateCategory,
            amount: parseFloat(rate.amount),
            stickerNumber,
        });
        totalAmount += parseFloat(rate.amount);
    }

    return { residentId, year, items, totalAmount: Math.round(totalAmount * 100) / 100 };
};

module.exports = { resolveStickerRates };
