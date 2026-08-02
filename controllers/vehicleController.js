const vehicleService = require('../services/vehicleService');
const VehicleModel = require('../models/vehicleModel'); // Keep this if get/delete still use it directly
const stickerRateService = require('../services/stickerRateService');

// GET /vehicles/sticker-rate-estimate?person_id=123&vehicle_ids=1&vehicle_ids=2
// Read-only estimate shown on the payment form before submission (AC 1.2/1.3/1.4).
// The Vehicle Sticker payment itself re-computes this server-side on submit,
// so this endpoint is for display purposes only and is not the source of truth.
exports.getStickerRateEstimate = async (req, res) => {
    try {
        const { person_id } = req.query;
        let vehicleIds = req.query.vehicle_ids || [];
        if (!Array.isArray(vehicleIds)) vehicleIds = [vehicleIds];

        const resolved = await stickerRateService.resolveStickerRates(vehicleIds, person_id || null);

        res.json({
            success: true,
            totalAmount: resolved.totalAmount,
            items: resolved.items.map(item => ({
                vehicle_id: item.vehicle.vehicle_id,
                plate_number: item.vehicle.plate_number,
                type: item.vehicle.type,
                rateCategory: item.rateCategory,
                amount: item.amount,
                stickerNumber: item.stickerNumber,
            })),
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getVehicles = async (req, res) =>{
    try{
        const vehicles = await VehicleModel.getAllVehicles();
        const residents = await VehicleModel.getAllResidents();

        res.render('vehicles', {
            title: 'Vehicles',
            activePage: 'vehicles',
            pageCSS: 'vehicles.css',
            vehicles: vehicles,
            residents: residents
        });
    }
    catch(error){
        console.error("Cannot fetch vehicles:", error);
        res.status(500).send("Server Error loading vehicles.");
    }
};

exports.registerVehicle = async (req, res) =>{
    // cleaning
    const plate_number = req.body.plate_number ? req.body.plate_number.trim().toUpperCase() : '';
    const type = req.body.type ? req.body.type.trim() : '';
    const make = req.body.make ? req.body.make.trim() : '';
    const model = req.body.model ? req.body.model.trim() : '';
    const color = req.body.color ? req.body.color.trim() : '';
    const sticker_year = req.body.sticker_year || null;
    const status = req.body.status ? req.body.status.trim() : 'Active';
    
    let resident_ids = req.body.resident_ids;

    if(resident_ids){
        resident_ids = Array.isArray(resident_ids) ? resident_ids : [resident_ids];
    }
    else{
        resident_ids = [];
    }
    
    // initial validation
    if (!type || !plate_number || !make || !model || !color || resident_ids.length === 0) {
        return res.status(400).json({ success: false, message: "Type, Plate number, Make, Model, Color, and Residents are required." });
    }

    // redirect to services for the uhhhhhh services stuff
    try{
        const vehicleData = { type, plate_number, make, model, color, sticker_year, status };
        
        await vehicleService.registerVehicle(vehicleData, resident_ids);

        res.json({ success: true, message: "Vehicle added successfully!" });
    }
    catch(error){
        console.error("Cannot save vehicle:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateVehicle = async (req, res) =>{
    const vehicleId = req.params.id;
    
    // cleaning
    const type = req.body.type ? req.body.type.trim() : '';
    const plate_number = req.body.plate_number ? req.body.plate_number.trim().toUpperCase() : '';
    const make = req.body.make ? req.body.make.trim() : '';
    const model = req.body.model ? req.body.model.trim() : '';
    const color = req.body.color ? req.body.color.trim() : '';
    const sticker_year = req.body.sticker_year || null;
    const status = req.body.status ? req.body.status.trim() : 'Active';
    
    let resident_ids = req.body.resident_ids;

    if(resident_ids){
        resident_ids = Array.isArray(resident_ids) ? resident_ids : [resident_ids];
    }
    else{
        resident_ids = [];
    }
    
    // initial validation
    if (!type || !plate_number || !make || !model || !color || resident_ids.length === 0) {
        return res.status(400).json({ success: false, message: "Type, Plate number, Make, Model, Color, and Residents are required." });
    }

    // los servicios
    try{
        const vehicleData = { type, plate_number, make, model, color, sticker_year, status };
        
        await vehicleService.updateVehicle(vehicleId, vehicleData, resident_ids);

        res.json({ success: true, message: "Vehicle updated successfully!" });
    }
    catch(error){
        console.error("Cannot update vehicle details:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteVehicle = async (req, res) =>{
    try{
        const vehicleId = req.params.id;
        
        await VehicleModel.deleteVehicle(vehicleId);
        res.json({ success: true, message: "Vehicle deleted successfully!" });
    }
    catch (error){
        console.error("Cannot delete vehicle:", error);
        res.status(400).json({ success: false, message: "Error deleting vehicle." });
    }
};