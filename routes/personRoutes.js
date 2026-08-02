const express          = require('express');
const router           = express.Router();
const personController = require('../controllers/personController');

// GET  /persons        → list all persons
// POST /persons        → create a new person         (SPRINT 2+)
// GET  /persons/:id    → view a single person         (SPRINT 2+)
// PUT  /persons/:id    → update a person              (SPRINT 2+)
// DELETE /persons/:id  → delete a person              (SPRINT 2+)

router.get('/', personController.getPersons);

module.exports = router;
