const {pool} = require("../config/db");
const personModel = require("../models/personModel");
const residentModel = require("../models/residentModel");
const boardMemberModel = require("../models/boardMemberModel");
const propertyModel = require("../models/propertyModel");
const vehicleModel = require("../models/vehicleModel");


const addResident = async (data) => {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        let person_id;
        let resident_id;

        // Check if the person already exists
        const person = await personModel.selectPersonByName(data, conn);

        if (person) {
            person_id = person.person_id;

            const activeResident =
                await residentModel.findActiveResidentByPersonId(person_id, conn);

            if (activeResident) {
                throw new Error("This resident already exists!");
            }
        } else {
            person_id = await personModel.addPerson(data, conn);

            if (!person_id) {
                throw new Error("Failed to create Person record");
            }
        }

        // Create the resident record (whether the person already existed or was just created)
        resident_id = await residentModel.addResident(data, person_id, conn);

        if (!resident_id) {
            throw new Error("Failed to create Resident record");
        }

        await conn.commit();
        return resident_id;

    } catch (err) {
        await conn.rollback();
        throw err;

    } finally {
        conn.release();
    }
};

const updateResident = async(data) => {

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

         //check if the resident that is being edited exists
        const existingResident = await residentModel.selectPersonByResidentId(data.resident_id, conn);

        if(existingResident === null) {
            throw new Error("Resident does not exist!");
        }

        await personModel.updatePerson(data, existingResident.person_id, conn);
        await residentModel.updateResident(data.residency_start_date, data.resident_id, conn);

        // Manual delinquent toggle from the edit form
        if (data.isDelinquent !== undefined) {
            const flag = data.isDelinquent === '1' || data.isDelinquent === true || data.isDelinquent === 1;
            await residentModel.setDelinquent(data.resident_id, flag, conn);
        }

        await conn.commit();
    } catch(err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }

}

const endResidency = async(resident_id, end_date) => {
    const conn = await pool.getConnection();

     try {
        await conn.beginTransaction();

         //endResidency
        await residentModel.deactivateResident(resident_id, end_date, conn);
         //delete property relationships
        const properties = await propertyModel.selectPropertiesByResidentId(resident_id, conn);
        
        for (const p of properties) {
            await propertyModel.deleteResidentProperty(resident_id, p.property_id, conn);
        }

        await conn.commit();
    } catch(err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

const deleteResident = async(resident_id) => {
    const conn = await pool.getConnection();

    try{

        await conn.beginTransaction();

        await residentModel.deleteResident(resident_id, conn);
        
        //get all the properties and vehicles they own
        const properties = await propertyModel.selectPropertiesByResidentId(resident_id, conn);
        
        const vehicles = await vehicleModel.getAllVehiclesByResident(resident_id, conn);
        
        //delete resident_property given residentid
        for (const p of properties) {
            await propertyModel.deleteResidentProperty(resident_id, p.property_id, conn);
        }
        
         //delete resident_vehicle given residentid
        for(const v of vehicles) {
            await vehicleModel.deleteResidentVehicle(resident_id, v.vehicle_id, conn)
        }
        

        await conn.commit();

    } catch(err) {
        await conn.rollback();
        throw err;
    } finally {
         conn.release();
    }
}

module.exports = {
    addResident, 
    updateResident,
    deleteResident,
    endResidency
}