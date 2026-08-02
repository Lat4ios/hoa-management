// RESIDENT CONTROLLER
// manages the Resident table  
// SPRINT 2+: connect all functions to the database via models.

const residentService = require('../services/residentService');
const residentModel = require('../models/residentModel');
const boardMemberModel = require('../models/boardMemberModel');

const getResidents = async (req, res) => {
    try {
        const [residents, boardMembers] = await Promise.all([
            residentModel.getAllResidents(),
            boardMemberModel.getAllBoardMembers(),
        ]);

        res.render('residents', {
            title:      'Residents',
            activePage: 'residents',
            pageCSS:    'residents.css',
            residents,
            boardMembers,
            error:      req.query.error   || null,
            success:    req.query.success || null,
        });
    } catch(err) {
        console.log("Error fetching residents: ", err);
        return res.status(500).send('Failed to load residents');
    }
};

const addResident = async(req, res) => {
    try {
        await residentService.addResident(req.body);
        console.log(req.body);
        res.redirect('/residents?success=Resident+added+successfully.');
        
    } catch(err) {
        console.log("Failed to add resident: ", err);
       res.redirect(`/residents?error=${encodeURIComponent(err.message)}`);
       //if error is duplicate resident, 
    }
}

const updateResident = async(req, res) => {
    try {
        const data = {
            ...req.body,
            residentId: req.params.id
        };
        
        await residentService.updateResident(data);
        res.redirect('/residents?success=Resident+updated+successfully.');
    } catch(err) {
        console.error('Edit Resident error: ', err);
        res.redirect('/residents?error=Failed+to+update+resident.');
    }
    
};

const deleteResident = async (req, res) => {
    try {
        console.log(req.params.id);
        await residentService.deleteResident(req.params.id);
        return res.redirect('/residents');
    } catch(err) {
        console.log("Failed to delete resident: ", err);
        return res.redirect('/residents?error=Failed+to+delete+resident');
    }
};

const endResidency = async (req, res) => {
    try {
        console.log(req.params.id);
        await residentService.endResidency(req.params.id, req.body.residency_end_date);
        return res.redirect('/residents');
    } catch(err) {
        console.log("Failed to end residency: ", err);
        return res.redirect('/residents?error=Failed+to+end+residency');
    }
}

const getResidentOutstanding = async (req, res) => {
    try {
        const rows = await residentModel.getDelinquentPropertiesByResidentId(req.params.id);
        res.json(rows);
    } catch (err) {
        console.error('getResidentOutstanding error:', err);
        res.status(500).json({ error: 'Failed to load outstanding balance.' });
    }
};

module.exports = {
    getResidents,
    addResident,
    deleteResident,
    updateResident,
    endResidency,
    getResidentOutstanding,
};
