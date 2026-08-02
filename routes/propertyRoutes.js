const express            = require('express');
const router             = express.Router();
const propertyController = require('../controllers/propertyController');

router.get('/',                           propertyController.getProperties);
router.get('/:id/residents',              propertyController.getPropertyResidents);
router.get('/:id/association-dues-estimate', propertyController.getAssociationDuesEstimate);
router.post('/',                          propertyController.createProperty);
router.post('/:id/update',                propertyController.updateProperty);
router.post('/:id/delete',                propertyController.deleteProperty);
router.post('/:id/outstanding-balance',   propertyController.setOutstandingBalance);

module.exports = router;
