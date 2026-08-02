const express            = require('express');
const router             = express.Router();
const stickerController  = require('../controllers/stickerController');

// GET  /stickers        → list all car stickers
// POST /stickers        → issue a new sticker        (SPRINT 2+)
// PUT  /stickers/:id    → update sticker info        (SPRINT 2+)
// DELETE /stickers/:id  → remove a sticker           (SPRINT 2+)

router.get('/', stickerController.getStickers);

module.exports = router;
