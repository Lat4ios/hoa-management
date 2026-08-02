const dashboardModel = require('../models/dashboardModel');

exports.getDashboard = async (req, res) => {
    try {
        const [stats, propertyStatus, delinquents, boardMembers, recentPayments] = await Promise.all([
            dashboardModel.getStats(),
            dashboardModel.getPropertyStatus(),
            dashboardModel.getDelinquents(),
            dashboardModel.getCurrentBoardMembers(),
            dashboardModel.getRecentPayments(),
        ]);

        res.render('dashboard', {
            title:          'Dashboard',
            activePage:     'dashboard',
            pageCSS:        'dashboard.css',
            stats,
            propertyStatus,
            delinquents,
            boardMembers,
            recentPayments,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).send('Failed to load dashboard.');
    }
};
