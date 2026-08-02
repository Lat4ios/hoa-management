// CAR STICKER CONTROLLER
// SPRINT 2+: connect all functions to the database via models.

exports.getStickers = (req, res) => {
    // TODO (SPRINT 2+): QUERY Car_Sticker JOIN Vehicle TABLE FROM DB
    const stickers = [];

    res.render('stickers', {
        title:      'Car Stickers',
        activePage: 'stickers',
        stickers,
    });
};

exports.issueSticker = (req, res) => {
    // TODO (SPRINT 2+): INSERT INTO Car_Sticker TABLE (plate_number, date_issued, date_expired)
};

exports.updateSticker = (req, res) => {
    // TODO (SPRINT 2+): UPDATE Car_Sticker TABLE WHERE sticker_id = req.params.id
};

exports.deleteSticker = (req, res) => {
    // TODO (SPRINT 2+): DELETE FROM Car_Sticker TABLE WHERE sticker_id = req.params.id
};
