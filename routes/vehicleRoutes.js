const express            = require('express');
const router             = express.Router();
const vehicleController  = require('../controllers/vehicleController');

// list all vehicles
router.get('/', vehicleController.getVehicles);

// live sticker rate estimate for the payment form (supports multiple vehicle_ids)
router.get('/sticker-rate-estimate', vehicleController.getStickerRateEstimate);

// register a vehicle 
router.post('/register', vehicleController.registerVehicle);

// update vehicle info
router.post('/update/:id', vehicleController.updateVehicle);

// remove a vehicle 
router.post('/delete/:id', vehicleController.deleteVehicle);

module.exports = router;