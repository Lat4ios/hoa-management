const paymentLedgerModel        = require('../models/paymentLedgerModel');
const propertyModel             = require('../models/propertyModel');
const residentModel             = require('../models/residentModel');
const vehicleModel              = require('../models/vehicleModel');
const rateModel                 = require('../models/rateModel');
const stickerRateService        = require('./stickerRateService');
const associationDuesRateService = require('./associationDuesRateService');
const { pool }                  = require('../config/db');

// AC 3.3: fields required for every payment, regardless of purpose.
const REQUIRED_FIELDS = {
    receipt_number: 'Receipt Number',
    date_paid:      'Date Paid',
    payment_method: 'Payment Method',
    paid_by:        'Resident',
};

const assertRequiredFields = (data) => {
    const missing = Object.entries(REQUIRED_FIELDS)
        .filter(([key]) => !data[key] || String(data[key]).trim() === '')
        .map(([, label]) => label);
    if (missing.length > 0) {
        throw new Error(`The following fields are required: ${missing.join(', ')}.`);
    }
};

// AC 5/6: date paid cannot be in the future (server-side backstop —
// the form's <input type="date" max="..."> already blocks this client-side).
const assertDateNotFuture = (datePaidStr) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    if (datePaidStr > today) {
        throw new Error('Date paid cannot be in the future.');
    }
};

const addPayment = async (data) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        let vehicleRateItems  = null; // items resolved for Vehicle Sticker payments
        let associationResult = null; // resolved rate for Association Dues payments

        if (data.purpose === 'Vehicle Sticker') {
            assertRequiredFields(data);
            assertDateNotFuture(data.date_paid);

            const vehicleIds = Array.isArray(data.vehicle_ids)
                ? data.vehicle_ids
                : (data.vehicle_ids ? [data.vehicle_ids] : []);

            if (vehicleIds.length > 0) {
                // Vehicle selected from database (existing /dues/vehicle flow)
                const resolved = await stickerRateService.resolveStickerRates(vehicleIds, data.paid_by, conn);
                vehicleRateItems = resolved.items;
                data.amount_expected = resolved.totalAmount;
            } else if (data.plate_number && data.vehicle_type) {
                // Manual plate number entry (from /dues/association sticker toggle)
                const rate = await rateModel.getRateByCategory(data.vehicle_type, conn);
                if (!rate) throw new Error(`No rate found for vehicle type: ${data.vehicle_type}`);
                data.amount_expected = parseFloat(rate.amount);
                const plateNote = `Plate: ${data.plate_number}`;
                data.remarks = data.remarks ? `${plateNote} — ${data.remarks}` : plateNote;
            } else {
                throw new Error('Please provide a vehicle or enter a plate number and vehicle type.');
            }

        }

        if (data.purpose === 'Association Dues') {
            assertRequiredFields(data);
            if (!data.property_id) {
                throw new Error('A property must be selected.');
            }
            assertDateNotFuture(data.date_paid);

            // amount_expected is never trusted from the client — always
            // computed here from the current Rates table (rate × duration
            // only; existing arrears are handled separately via Outstanding Balance).
            associationResult = await associationDuesRateService.resolveAssociationDuesRate(
                data.property_id, data.payment_type, data.months, conn
            );
            data.amount_expected = associationResult.amount;

        }

        const paymentId = await paymentLedgerModel.createPayment(data, conn);

        if (vehicleRateItems) {
            // AC 4.2: persist which vehicles this payment covers, and flip
            // hasSticker on each one now that the sticker is paid for.
            await paymentLedgerModel.createPaymentVehicleLinks(
                paymentId,
                vehicleRateItems.map(item => ({ vehicle_id: item.vehicle.vehicle_id, rateCategory: item.rateCategory })),
                conn
            );
            const year = new Date().getFullYear();
            for (const item of vehicleRateItems) {
                await vehicleModel.markStickerIssued(item.vehicle.vehicle_id, year, conn);
            }
        }

        if (associationResult) {
            await paymentLedgerModel.createAssociationDuesRecord(paymentId, associationResult.isAnnual, conn);

            // Dues are always paid in full here (underpayment is blocked above),
            // so clear the payer's delinquent flag. Property.outstandingBalance /
            // hasDues (arrears) are intentionally left untouched — those are
            // only managed by the separate Outstanding Balance payment flow.
            if (data.paid_by) {
                const r = await residentModel.getResidentIdByPersonId(data.paid_by, conn);
                if (r) {
                    await residentModel.setDelinquent(r.resident_id, false, conn);
                }
            }
        }

        if (data.purpose === 'Outstanding Balance' && data.property_id) {
            const propertyId = parseInt(data.property_id);
            const amountPaid = parseFloat(data.amount_paid) || 0;

            let residentId = null;
            if (data.paid_by) {
                const r = await residentModel.getResidentIdByPersonId(data.paid_by, conn);
                if (r) residentId = r.resident_id;
            }

            await paymentLedgerModel.createOutstandingBalanceRecord(paymentId, propertyId, residentId, conn);

            const [[prop]] = await conn.query(
                `SELECT outstandingBalance FROM Property WHERE property_id = ?`,
                [propertyId]
            );
            if (prop) {
                const newBalance = Math.max(0, parseFloat(prop.outstandingBalance) - amountPaid);
                await conn.query(
                    `UPDATE Property SET outstandingBalance = ?, hasDues = ? WHERE property_id = ?`,
                    [newBalance, newBalance > 0 ? 1 : 0, propertyId]
                );
                if (newBalance === 0) {
                    await propertyModel.clearResidentsDelinquentForProperty(propertyId, conn);
                }
            }
        }

        await conn.commit();
        return paymentId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const updatePayment = async (payment_id, data) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await paymentLedgerModel.updatePayment(payment_id, data, conn);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const deletePayment = async (payment_id) => {
    return paymentLedgerModel.deletePayment(payment_id);
};

module.exports = { addPayment, updatePayment, deletePayment };
