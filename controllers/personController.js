// PERSON CONTROLLER
// SPRINT 2+: connect all functions to the database via models.

exports.getPersons = (req, res) => {
    // TODO (SPRINT 2+): QUERY Person TABLE FROM DB
    const persons = [];

    res.render('persons', {
        title:      'Persons',
        activePage: 'persons',
        persons,
    });
};

exports.createPerson = (req, res) => {
    // TODO (SPRINT 2+): INSERT INTO Person TABLE
};

exports.updatePerson = (req, res) => {
    // TODO (SPRINT 2+): UPDATE Person TABLE WHERE person_id = req.params.id
};

exports.deletePerson = (req, res) => {
    // TODO (SPRINT 2+): DELETE FROM Person TABLE WHERE person_id = req.params.id
};
