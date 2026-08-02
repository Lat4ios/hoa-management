const express             = require('express');
const router              = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ── AUTH PAGES (no sidebar — use auth layout) ──────────────────────────────
router.get('/',                (req, res) => res.redirect('/login'));
router.get('/login',           (req, res) => res.render('login',            { layout: 'layouts/auth', title: 'HOA Login' }));
router.get('/forgot-password', (req, res) => res.render('forgot-password',  { layout: 'layouts/auth', title: 'Forgot Password' }));
router.get('/hoa-admin',       (req, res) => res.render('hoa-admin',        { layout: 'layouts/auth', title: 'HOA Admin' }));

// ── DASHBOARD ──────────────────────────────────────────────────────────────
router.get('/dashboard', dashboardController.getDashboard);

module.exports = router;
