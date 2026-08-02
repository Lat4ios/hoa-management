const { pool } = require('../config/db');
const AccountModel = require('../models/accountModel');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const AccountService = {
    // ─── AUTHENTICATION ──────────────────────────────────────────────────────
    
    authenticate: async (username, password, accountType) => {
        let user;
        
        if (accountType === 'admin') {
            user = await AccountModel.getAdminByUsername(username);
        } else if (accountType === 'board') {
            user = await AccountModel.getBoardMemberAccountByUsername(username);
        } else {
            user = await AccountModel.getAdminByUsername(username);
            if (!user) {
                user = await AccountModel.getBoardMemberAccountByUsername(username);
                accountType = 'board';
            } else {
                accountType = 'admin';
            }
        }

        if (!user) {
            return null;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return null;
        }

        if (user.isActive === 0) {
            throw new Error('Account is deactivated.');
        }

        const table = accountType === 'admin' ? 'Admin' : 'BoardMemberAccount';
        const id = accountType === 'admin' ? user.admin_id : user.account_id;
        await AccountModel.updateLastLogin(table, id);

        const { password_hash, ...userInfo } = user;
        return { ...userInfo, accountType };
    },

    // ─── ADMIN ACCOUNTS ──────────────────────────────────────────────────────
    
    getAllAdmins: async () => {
        return await AccountModel.getAllAdmins();
    },

    getAdminById: async (admin_id) => {
        return await AccountModel.getAdminById(admin_id);
    },

    createAdmin: async (data) => {
        const existing = await AccountModel.getAdminByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists.');
        }

        const existingEmail = await AccountModel.getAdminByEmail(data.email);
        if (existingEmail) {
            throw new Error('Email already registered.');
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        return await AccountModel.createAdmin(data, passwordHash);
    },

    updateAdmin: async (admin_id, data) => {
        const existing = await AccountModel.getAdminById(admin_id);
        if (!existing) {
            throw new Error('Admin not found.');
        }

        const usernameCheck = await AccountModel.getAdminByUsername(data.username);
        if (usernameCheck && usernameCheck.admin_id != admin_id) {
            throw new Error('Username already taken by another user.');
        }

        const emailCheck = await AccountModel.getAdminByEmail(data.email);
        if (emailCheck && emailCheck.admin_id != admin_id) {
            throw new Error('Email already registered to another user.');
        }

        return await AccountModel.updateAdmin(admin_id, data);
    },

    updateAdminPassword: async (admin_id, currentPassword, newPassword) => {
        const admin = await AccountModel.getAdminById(admin_id);
        if (!admin) {
            throw new Error('Admin not found.');
        }

        const adminFull = await AccountModel.getAdminByUsername(admin.username);
        const isMatch = await bcrypt.compare(currentPassword, adminFull.password_hash);
        if (!isMatch) {
            throw new Error('Current password is incorrect.');
        }

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        return await AccountModel.updateAdminPassword(admin_id, passwordHash);
    },

    deleteAdmin: async (admin_id) => {
        const admins = await AccountModel.getAllAdmins();
        if (admins.length <= 1) {
            throw new Error('Cannot delete the last admin account.');
        }

        return await AccountModel.deleteAdmin(admin_id);
    },

    // ─── BOARD MEMBER ACCOUNTS ──────────────────────────────────────────────
    
    getAllBoardMemberAccounts: async () => {
        return await AccountModel.getAllBoardMemberAccounts();
    },

    getBoardMemberAccountById: async (account_id) => {
        return await AccountModel.getBoardMemberAccountById(account_id);
    },

    getAvailableBoardMembers: async () => {
        return await AccountModel.getAvailableBoardMembers();
    },

    createBoardMemberAccount: async (data) => {
        const existing = await AccountModel.getBoardMemberAccountByUsername(data.username);
        if (existing) {
            throw new Error('Username already exists.');
        }

        const existingEmail = await AccountModel.getBoardMemberAccountByEmail(data.email);
        if (existingEmail) {
            throw new Error('Email already registered.');
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        return await AccountModel.createBoardMemberAccount(data, passwordHash);
    },

    updateBoardMemberAccount: async (account_id, data) => {
        const existing = await AccountModel.getBoardMemberAccountById(account_id);
        if (!existing) {
            throw new Error('Board member account not found.');
        }

        const usernameCheck = await AccountModel.getBoardMemberAccountByUsername(data.username);
        if (usernameCheck && usernameCheck.account_id != account_id) {
            throw new Error('Username already taken by another user.');
        }

        const emailCheck = await AccountModel.getBoardMemberAccountByEmail(data.email);
        if (emailCheck && emailCheck.account_id != account_id) {
            throw new Error('Email already registered to another user.');
        }

        return await AccountModel.updateBoardMemberAccount(account_id, data);
    },

    updateBoardMemberPassword: async (account_id, currentPassword, newPassword) => {
        const account = await AccountModel.getBoardMemberAccountById(account_id);
        if (!account) {
            throw new Error('Board member account not found.');
        }

        const accountFull = await AccountModel.getBoardMemberAccountByUsername(account.username);
        const isMatch = await bcrypt.compare(currentPassword, accountFull.password_hash);
        if (!isMatch) {
            throw new Error('Current password is incorrect.');
        }

        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        return await AccountModel.updateBoardMemberPassword(account_id, passwordHash);
    },

    deleteBoardMemberAccount: async (account_id) => {
        return await AccountModel.deleteBoardMemberAccount(account_id);
    },

    // ─── ADMIN CONTACT INFO ──────────────────────────────────────────────────
    
    getAdminContactInfo: async () => {
        return await AccountModel.getAdminContactInfo();
    },

    updateAdminContactInfo: async (data) => {
        return await AccountModel.updateAdminContactInfo(data);
    }
};

module.exports = AccountService;