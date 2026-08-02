const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ─── GENERATE REPORTS PAGE ───────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.render('generate_reports', {
        title: 'Generate Reports',
        activePage: 'generateReports',
        pageCSS: 'generate_reports.css',
        error: req.query.error || null,
        success: req.query.success || null,
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || ''
    });
});

// ─── REPORT EXPORT ENDPOINTS ────────────────────────────────────────────────
router.get('/export/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { startDate, endDate } = req.query;
        
        let data = [];
        let headers = [];
        
        switch(type) {
            case 'hoa-general':
                data = await reportController.getHoaGeneralReportData(startDate, endDate);
                headers = ['Property Type', 'Total', 'Active', 'Inactive', 'Notes'];
                break;
            case 'senior-citizens':
                data = await reportController.getSeniorCitizenReportData(startDate, endDate);
                headers = ['Name', 'Age', 'Status', 'Address', 'Category', 'Contact'];
                break;
            case 'delinquency':
                data = await reportController.getDelinquencyReportData(startDate, endDate);
                headers = ['Property', 'Lot Number', 'Street', 'Type', 'Outstanding Balance', 'Owner(s)', 'Last Payment'];
                break;
            case 'vehicle-sticker':
                data = await reportController.getVehicleStickerReportData(startDate, endDate);
                headers = ['Vehicle Type', 'Count', 'Sticker Fee', 'Total Revenue', 'Percentage'];
                break;
            case 'finances':
                data = await reportController.getFinancesReportData(startDate, endDate);
                headers = ['Category', 'Amount', 'Type', 'Date', 'Description', 'Payment Method'];
                break;
            default:
                throw new Error('Invalid report type');
        }
        
        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            csv += row.join(',') + '\n';
        });
        
        csv += '\n--- Report Period ---\n';
        csv += `Start Date,${startDate || 'All Time'}\n`;
        csv += `End Date,${endDate || 'All Time'}\n`;
        csv += `Generated,${new Date().toLocaleString()}`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
        
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;