
const { pool } = require("../config/db");

const vehicleModel = require("../models/vehicleModel");

const registerVehicle = async (vehicleData, residentIds) => {
    const conn = await pool.getConnection();

    try{
        await conn.beginTransaction();

        const existing = await vehicleModel.findByPlate(vehicleData.plate_number, conn);

        if(existing.length > 0){
            throw new Error("That plate number is already registered.");
        }

        const newVehicleId = await vehicleModel.createVehicle(vehicleData, conn);

        if(!newVehicleId){
            throw new Error("Failed to create Vehicle record");
        }

        if(residentIds && residentIds.length > 0){
            await vehicleModel.updateVehicleResidents(newVehicleId, residentIds, conn);
        }

        await conn.commit();
        return newVehicleId;

    }
    catch(err){
        await conn.rollback();
        throw err;
    }
    finally{
        conn.release();
    }
};

const updateVehicle = async (vehicleId, vehicleData, residentIds) => {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Check if plate belongs to another existing car
        const existing = await vehicleModel.findByPlate(vehicleData.plate_number, conn);
        if (existing.length > 0 && existing[0].vehicle_id != vehicleId) {
            throw new Error("That plate number is already registered to another vehicle.");
        }

        // 2. Update the main vehicle details
        await vehicleModel.updateVehicleData(vehicleId, vehicleData, conn);

        // 3. Update the resident relationships (wipes old, inserts new)
        await vehicleModel.updateVehicleResidents(vehicleId, residentIds, conn);

        await conn.commit();
        return true;

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

module.exports = {
    registerVehicle,
    updateVehicle
};