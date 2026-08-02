const express                  = require('express');
const router                   = express.Router();
const residentController  = require('../controllers/residentController');

router.get('/',                    residentController.getResidents);
router.get('/:id/outstanding',     residentController.getResidentOutstanding);
router.post('/',                   residentController.addResident);
router.post('/:id/delete',         residentController.deleteResident);
router.post('/:id/update',         residentController.updateResident);
router.post('/:id/endResidency',   residentController.endResidency);

module.exports = router;
