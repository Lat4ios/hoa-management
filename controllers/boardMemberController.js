const boardMemberModel   = require('../models/boardMemberModel');
const boardMemberService = require('../services/boardMemberService');

const getBoardMembers = async (req, res) => {
    try {
        const [boardMembers, residents] = await Promise.all([
            boardMemberModel.getAllBoardMembers(),
            boardMemberModel.selectAllResidents(),
        ]);
        res.render('boardMembers', {
            title:      'Board Members',
            activePage: 'boardMembers',
            pageCSS:    'board-members.css',
            boardMembers,
            residents,
            error:   req.query.error   || null,
            success: req.query.success || null,
        });
    } catch (err) {
        console.error('Error fetching board members:', err);
        res.status(500).send('Failed to load board members');
    }
};

const addBoardMember = async (req, res) => {
    try {
        await boardMemberService.addBoardMember(req.body);
        res.redirect('/residents?view=boardMembers&success=Board+member+added+successfully.');
    } catch (err) {
        console.error('Failed to add board member:', err);
        res.redirect(`/residents?view=boardMembers&error=${encodeURIComponent(err.message)}`);
    }
};

const updateBoardMember = async (req, res) => {
    try {
        await boardMemberService.updateBoardMember({
            ...req.body,
            board_id: req.params.id,
        });
        res.redirect('/residents?view=boardMembers&success=Board+member+updated+successfully.');
    } catch (err) {
        console.error('Failed to update board member:', err);
        res.redirect('/residents?view=boardMembers&error=Failed+to+update+board+member.');
    }
};

const endTerm = async (req, res) => {
    try {
        await boardMemberService.endTerm(req.params.id, req.body.board_end_date);
        res.redirect('/residents?view=boardMembers&success=Term+ended+successfully.');
    } catch (err) {
        console.error('Failed to end term:', err);
        res.redirect('/residents?view=boardMembers&error=Failed+to+end+term.');
    }
};

const deleteBoardMember = async (req, res) => {
    try {
        await boardMemberService.deleteBoardMember(req.params.id);
        res.redirect('/residents?view=boardMembers&success=Board+member+deleted+successfully.');
    } catch (err) {
        console.error('Failed to delete board member:', err);
        res.redirect('/residents?view=boardMembers&error=Failed+to+delete+board+member.');
    }
};

module.exports = {
    getBoardMembers,
    addBoardMember,
    updateBoardMember,
    endTerm,
    deleteBoardMember,
};
