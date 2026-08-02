exports.getPaymentDashboard = async (req, res) => {
    const payments = [];
    try {
        res.render('payments', {
            title:      'Payments',
            activePage: 'payments',
            pageCSS:    'payments.css',
            payments, 
        });
    } catch (err) {
        console.error('getPayments error:', err);
        res.status(500).send('Failed to load payments.');
    }
};

exports.createPayment = (req, res) => {
    // TODO
};

exports.updatePayment = (req, res) => {
    // TODO 
};

exports.deletePayment = (req, res) => {
    // TODO
};
