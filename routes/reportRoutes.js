const express          = require('express');
const router           = express.Router();
const reportController = require('../controllers/reportController');

router.get('/',                 reportController.getReportsHub);
router.get('/delinquency',      reportController.getDelinquencyReport);
router.get('/senior-citizens',  reportController.getSeniorCitizenReport);
router.get('/village-general',  reportController.getVillageGeneralReport);
router.get('/financials',       reportController.getFinancialsReport);

module.exports = router;
