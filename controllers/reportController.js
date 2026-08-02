const reportModel = require('../models/reportModel');

exports.getReportsHub = async (req, res) => {
    res.render('reports', {
        title:      'Reports',
        activePage: 'reports',
        pageCSS:    'reports.css',
    });
};

exports.getFinancialsReport = async (req, res) => {
    try {
        const today = new Date();
        const defaultFrom = `${today.getFullYear()}-01-01`;
        const defaultTo   = today.toISOString().slice(0, 10);

        let fromDate = req.query.from || defaultFrom;
        let toDate   = req.query.to   || defaultTo;

        if (toDate   > defaultTo) toDate   = defaultTo;
        if (fromDate > defaultTo) fromDate = defaultTo;
        if (fromDate > toDate)    fromDate = toDate;

        const fmtQueryDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
            month: 'long', day: 'numeric', year: 'numeric',
        });

        const data = await reportModel.getFinancialsReport(fromDate, toDate);

        res.render('financialsReport', {
            layout:          'layouts/report',
            title:           'Financials Report',
            ...data,
            fromDate,
            toDate,
            fromDateDisplay: fmtQueryDate(fromDate),
            toDateDisplay:   fmtQueryDate(toDate),
            generatedDate:   today.toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
            }),
        });
    } catch (err) {
        console.error('Financials report error:', err);
        res.status(500).send('Failed to generate financials report.');
    }
};

exports.getSeniorCitizenReport = async (req, res) => {
    try {
        const rows    = await reportModel.getSeniorCitizenRows();
        const summary = await reportModel.getSeniorCitizenSummary(rows);
        res.render('seniorCitizenReport', {
            layout:    'layouts/report',
            title:     'Senior Citizen Report',
            summary,
            rows,
            generatedDate: new Date().toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
            }),
        });
    } catch (err) {
        console.error('Senior citizen report error:', err);
        res.status(500).send('Failed to generate senior citizen report.');
    }
};

exports.getVillageGeneralReport = async (req, res) => {
    try {
        const today = new Date();
        const defaultFrom = `${today.getFullYear()}-01-01`;
        const defaultTo   = today.toISOString().slice(0, 10);

        let fromDate = req.query.from || defaultFrom;
        let toDate   = req.query.to   || defaultTo;

        // Clamp both dates to today and ensure from <= to
        if (toDate   > defaultTo) toDate   = defaultTo;
        if (fromDate > defaultTo) fromDate = defaultTo;
        if (fromDate > toDate)    fromDate = toDate;

        const fmtQueryDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', {
            month: 'long', day: 'numeric', year: 'numeric',
        });

        const data = await reportModel.getVillageGeneralReport(fromDate, toDate);

        res.render('villageGeneralReport', {
            layout:          'layouts/report',
            title:           'Village General Report',
            ...data,
            fromDate,
            toDate,
            fromDateDisplay: fmtQueryDate(fromDate),
            toDateDisplay:   fmtQueryDate(toDate),
            generatedDate:   today.toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
            }),
        });
    } catch (err) {
        console.error('Village general report error:', err);
        res.status(500).send('Failed to generate village general report.');
    }
};

exports.getDelinquencyReport = async (req, res) => {
    try {
        const [summary, rows] = await Promise.all([
            reportModel.getDelinquencyReportSummary(),
            reportModel.getDelinquencyReportRows(),
        ]);
        res.render('delinquencyReport', {
            layout:    'layouts/report',
            title:     'Delinquency Report',
            summary,
            rows,
            generatedDate: new Date().toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
            }),
        });
    } catch (err) {
        console.error('Delinquency report error:', err);
        res.status(500).send('Failed to generate delinquency report.');
    }
};
