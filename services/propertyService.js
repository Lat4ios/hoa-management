const { pool } = require('../config/db');
const propertyModel = require('../models/propertyModel');

const getAllProperties = async () => {
    return await propertyModel.selectAllProperties();
};

const getAllResidents = async () => {
    return await propertyModel.selectAllResidents();
};

const getPropertyResidents = async (propertyId) => {
    return await propertyModel.selectResidentsByPropertyId(propertyId);
};

const deduplicateResidents = (ids, types) => {
    const seen      = new Set();
    const uniqueIds   = [];
    const uniqueTypes = [];
    for (let i = 0; i < ids.length; i++) {
        const key = String(ids[i]);
        if (!seen.has(key)) {
            seen.add(key);
            uniqueIds.push(ids[i]);
            uniqueTypes.push(types[i]);
        }
    }
    return { ids: uniqueIds, types: uniqueTypes };
};

const createProperty = async (data) => {
    const existing = await propertyModel.selectPropertyByLotAndStreet(data.lot_number, data.street_name);
    if (existing) throw new Error('A property with that lot number and street already exists.');

    const { ids, types } = deduplicateResidents(data.resident_ids, data.resident_types);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const propertyId = await propertyModel.insertProperty(data, conn);

        for (let i = 0; i < ids.length; i++) {
            await propertyModel.insertResidentProperty(ids[i], propertyId, types[i], conn);
        }

        await conn.commit();
        return propertyId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const updateProperty = async (data) => {
    const existing = await propertyModel.selectPropertyByLotAndStreet(data.lot_number, data.street_name, data.property_id);
    if (existing) throw new Error('A property with that lot number and street already exists.');

    const { ids, types } = deduplicateResidents(data.resident_ids, data.resident_types);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await propertyModel.updatePropertyById(data, conn);

        // Replace all resident associations
        await propertyModel.deleteResidentsByPropertyId(data.property_id, conn);

        for (let i = 0; i < ids.length; i++) {
            await propertyModel.insertResidentProperty(ids[i], data.property_id, types[i], conn);
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const setOutstandingBalance = async (propertyId, amount) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await propertyModel.setOutstandingBalance(propertyId, amount, conn);
        if (amount > 0) {
            await propertyModel.markResidentsDelinquentForProperty(propertyId, conn);
        } else {
            await propertyModel.clearResidentsDelinquentForProperty(propertyId, conn);
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const deleteProperty = async (propertyId) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // AC4: clear delinquent on residents before the property (and its Resident_Property links) are removed
        await propertyModel.clearResidentsDelinquentForProperty(propertyId, conn);
        await propertyModel.deletePropertyById(propertyId, conn);
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

module.exports = {
    getAllProperties,
    getAllResidents,
    getPropertyResidents,
    createProperty,
    updateProperty,
    deleteProperty,
    setOutstandingBalance,
};
