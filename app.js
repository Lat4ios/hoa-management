const express        = require('express');
const expressLayouts = require('express-ejs-layouts');
const path           = require('path');
const {connectDB, createTables}= require('./config/db')

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const indexRoutes               = require('./routes/index');
const accountRoutes             = require('./routes/accountRoutes');
const personRoutes              = require('./routes/personRoutes');
const propertyRoutes            = require('./routes/propertyRoutes');
const propertyOwnerRoutes       = require('./routes/propertyOwnerRoutes');
const employeeRoutes            = require('./routes/employeeRoutes');
const vehicleRoutes             = require('./routes/vehicleRoutes');
const stickerRoutes             = require('./routes/stickerRoutes');
const residentRoutes            = require('./routes/residentRoutes'); 
const boardMemberRoutes         = require('./routes/boardMemberRoutes');
const financeDashboardRoutes    = require('./routes/financeDashboardRoutes'); 
const paymentLedgerRoutes       = require('./routes/paymentLedgerRoutes');
const paymentRoutes             = require('./routes/paymentRoutes');
const expenseRoutes             = require('./routes/expenseRoutes');
const rateRoutes                = require('./routes/rateRoutes');
const reportRoutes              = require('./routes/reportRoutes');
const generateReportRoutes      = require('./routes/generateReportRoutes');

app.use('/',                    indexRoutes);
app.use('/accounts',            accountRoutes);
app.use('/persons',             personRoutes);
app.use('/properties',          propertyRoutes);
app.use('/property-owners',     propertyOwnerRoutes);
app.use('/employees',           employeeRoutes);
app.use('/vehicles',            vehicleRoutes);
app.use('/stickers',            stickerRoutes);
app.use('/residents',           residentRoutes); 
app.use('/boardMembers',        boardMemberRoutes);
app.use('/finances',            financeDashboardRoutes);   
app.use('/payments',            paymentLedgerRoutes);
app.use('/dues',                paymentRoutes);
app.use('/expenses',            expenseRoutes);
app.use('/rates',               rateRoutes);
app.use('/reports',             reportRoutes);
app.use('/generate-reports',    generateReportRoutes);

connectDB();
createTables();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`HOA server running -> http://0.0.0.0:${PORT}`);
});