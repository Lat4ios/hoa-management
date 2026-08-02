const AccountService = require('../services/accountService');

const AccountController = {
    getAccountManagement: async (req, res) => {
        try {
            const [admins, boardAccounts, availableBoardMembers, adminContact] = await Promise.all([
                AccountService.getAllAdmins(),
                AccountService.getAllBoardMemberAccounts(),
                AccountService.getAvailableBoardMembers(),
                AccountService.getAdminContactInfo()
            ]);

            res.render('accountManagement', {
                title: 'Account Management',
                activePage: 'accountManagement',
                pageCSS: 'account-management.css',
                admins,
                boardAccounts,
                availableBoardMembers,
                adminContact: adminContact || {},
                error: req.query.error || null,
                success: req.query.success || null
            });
        } catch (err) {
            console.error('Account management error:', err);
            res.status(500).send('Failed to load account management page.');
        }
    },

    createAdmin: async (req, res) => {
        try {
            const { username, password, email, contact_num } = req.body;

            if (!username || !password || !email) {
                throw new Error('Username, password, and email are required.');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
            }

            await AccountService.createAdmin({
                username,
                password,
                email,
                contact_num: contact_num || null
            });

            res.redirect('/accounts?success=Admin+account+created+successfully.');
        } catch (err) {
            console.error('Create admin error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    updateAdmin: async (req, res) => {
        try {
            const { username, email, contact_num } = req.body;
            const admin_id = req.params.id;

            await AccountService.updateAdmin(admin_id, {
                username,
                email,
                contact_num: contact_num || null
            });

            res.redirect('/accounts?success=Admin+account+updated+successfully.');
        } catch (err) {
            console.error('Update admin error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    resetAdminPassword: async (req, res) => {
        try {
            const { current_password, new_password, confirm_password } = req.body;
            const admin_id = req.params.id;

            if (!current_password || !new_password || !confirm_password) {
                throw new Error('All password fields are required.');
            }

            if (new_password.length < 6) {
                throw new Error('New password must be at least 6 characters.');
            }

            if (new_password !== confirm_password) {
                throw new Error('Passwords do not match.');
            }

            await AccountService.updateAdminPassword(admin_id, current_password, new_password);

            res.redirect('/accounts?success=Admin+password+updated+successfully.');
        } catch (err) {
            console.error('Reset admin password error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    deleteAdmin: async (req, res) => {
        try {
            const admin_id = req.params.id;
            await AccountService.deleteAdmin(admin_id);
            res.redirect('/accounts?success=Admin+account+deleted+successfully.');
        } catch (err) {
            console.error('Delete admin error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    createBoardMemberAccount: async (req, res) => {
        try {
            const { username, password, email, contact_num, board_member_id, isActive } = req.body;

            if (!username || !password || !email) {
                throw new Error('Username, password, and email are required.');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters.');
            }

            await AccountService.createBoardMemberAccount({
                username,
                password,
                email,
                contact_num: contact_num || null,
                board_member_id: board_member_id || null,
                isActive: isActive ? 1 : 0
            });

            res.redirect('/accounts?success=Board+member+account+created+successfully.');
        } catch (err) {
            console.error('Create board member account error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    updateBoardMemberAccount: async (req, res) => {
        try {
            const { username, email, contact_num, board_member_id, isActive } = req.body;
            const account_id = req.params.id;

            await AccountService.updateBoardMemberAccount(account_id, {
                username,
                email,
                contact_num: contact_num || null,
                board_member_id: board_member_id || null,
                isActive: isActive ? 1 : 0
            });

            res.redirect('/accounts?success=Board+member+account+updated+successfully.');
        } catch (err) {
            console.error('Update board member account error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    resetBoardMemberPassword: async (req, res) => {
        try {
            const { current_password, new_password, confirm_password } = req.body;
            const account_id = req.params.id;

            if (!current_password || !new_password || !confirm_password) {
                throw new Error('All password fields are required.');
            }

            if (new_password.length < 6) {
                throw new Error('New password must be at least 6 characters.');
            }

            if (new_password !== confirm_password) {
                throw new Error('Passwords do not match.');
            }

            await AccountService.updateBoardMemberPassword(account_id, current_password, new_password);

            res.redirect('/accounts?success=Board+member+password+updated+successfully.');
        } catch (err) {
            console.error('Reset board member password error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    deleteBoardMemberAccount: async (req, res) => {
        try {
            const account_id = req.params.id;
            await AccountService.deleteBoardMemberAccount(account_id);
            res.redirect('/accounts?success=Board+member+account+deleted+successfully.');
        } catch (err) {
            console.error('Delete board member account error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    },

    updateAdminContactInfo: async (req, res) => {
        try {
            const { email, contact_num } = req.body;

            if (!email) {
                throw new Error('Email is required.');
            }

            await AccountService.updateAdminContactInfo({ email, contact_num });

            res.redirect('/accounts?success=Admin+contact+information+updated.');
        } catch (err) {
            console.error('Update admin contact error:', err);
            res.redirect(`/accounts?error=${encodeURIComponent(err.message)}`);
        }
    }
};

module.exports = AccountController;