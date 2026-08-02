const rateModel = require('../models/rateModel');
const rateService = require('../services/rateService');

exports.getRatesPage = async (req, res) => {
    try {
        const rates = await rateModel.getActiveRates();

        res.render('rates', {
            title: 'Rates',
            activePage: 'rates',
            pageCSS: 'rates.css',
            rates: rates || [],
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        console.error('Error loading data for rates', error);
        res.status(500).send("Server Error: Failed to load rates data.");
    }
};

exports.updateRate = async (req, res) => {
    const rateId = req.body.rate_id;
    const amount = req.body.amount;

    // Validate input
    if (!rateId) {
        return res.redirect('/rates?error=Invalid+rate+selected.');
    }

    if (amount === undefined || amount === null || amount === '') {
        return res.redirect('/rates?error=Please+enter+a+valid+amount.');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.redirect('/rates?error=Please+enter+a+positive+number.');
    }

    if (parsedAmount === 0) {
        return res.redirect('/rates?error=Amount+cannot+be+zero.');
    }

    try {
        await rateService.updateRate(rateId, parsedAmount);
        res.redirect('/rates?success=Rate+updated+successfully!');
    } catch (error) {
        console.error('Error updating rate:', error);
        res.redirect(`/rates?error=${encodeURIComponent(error.message)}`);
    }
};