const express              = require('express');
const router               = express.Router();
const boardMemberController = require('../controllers/boardMemberController');

router.get('/',              boardMemberController.getBoardMembers);
router.post('/',             boardMemberController.addBoardMember);
router.post('/:id/update',   boardMemberController.updateBoardMember);
router.post('/:id/end-term', boardMemberController.endTerm);
router.post('/:id/delete',   boardMemberController.deleteBoardMember);

module.exports = router;
