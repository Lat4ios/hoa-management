const financeDashboardModel = require('../models/financeDashboardModel');

exports.getFinanceDashboard = async (req, res) => {
    try {
        const [stats, recentTransactions] = await Promise.all([
            financeDashboardModel.getFinanceStats(),
            financeDashboardModel.getRecentTransactions(),
        ]);
        res.render('financeDashboard', {
            title:            'Finance',
            activePage:       'financeDashboard',
            pageCSS:          'finance-dashboard.css',
            stats,
            recentTransactions,
        });
    } catch (err) {
        console.error('Finance dashboard error:', err);
        res.status(500).send('Failed to load finance dashboard');
    }
};
