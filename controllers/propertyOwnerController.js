// PROPERTY OWNER CONTROLLER
// manages the Property_Owner join table (person <--> property).
// SPRINT 2+: connect all functions to the database via models.

exports.getPropertyOwners = (req, res) => {
    // TODO (SPRINT 2+): JOIN Property_Owner WITH Person AND Property TABLES
    const owners = [];

    res.render('property-owners', {
        title:      'Property Owners',
        activePage: 'property-owners',
        pageCSS:    'property-owners.css',
        owners,
    });
};

exports.assignOwner = (req, res) => {
    // TODO (SPRINT 2+): INSERT INTO Property_Owner TABLE
};

exports.updateOwner = (req, res) => {
    // TODO (SPRINT 2+): UPDATE Property_Owner TABLE
};

exports.removeOwner = (req, res) => {
    // TODO (SPRINT 2+): DELETE FROM Property_Owner TABLE
};
