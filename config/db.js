const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');

// Use Render's Internal Database URL if available
const connectionString = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL;

console.log('🔍 Database Configuration:');
console.log('DATABASE_URL:', connectionString ? '✅ SET' : '❌ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

const connectDB = async() => {
    try {
        console.log('🔄 Attempting to connect to PostgreSQL database...');
        const client = await pool.connect();
        console.log("✅ Successfully connected to PostgreSQL database!");
        client.release();
        return true;
    } catch(err) {
        console.error('❌ Database connection failed!');
        console.error('Error:', err.message);
        return false;
    }
};

const createTables = async() => {
    try {
        console.log('🔄 Creating database tables...');

        const createPersonTable = `
            CREATE TABLE IF NOT EXISTS Person(
                person_id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                middle_name VARCHAR(255),
                suffix VARCHAR(50),
                birth_date DATE,
                email VARCHAR(255),
                contact_num VARCHAR(100)
            );
        `;

        const createEmployeeTable = `
            CREATE TABLE IF NOT EXISTS Employee(
                employee_id SERIAL PRIMARY KEY,
                salary DECIMAL(10, 2),
                position VARCHAR(50) NOT NULL,
                employee_start_date DATE,
                employee_end_date DATE,
                person_id INTEGER REFERENCES Person(person_id) ON DELETE CASCADE
            );
        `;

        const createResidentTable = `
            CREATE TABLE IF NOT EXISTS Resident(
                resident_id SERIAL PRIMARY KEY,
                residency_start_date DATE,
                residency_end_date DATE,
                isActive BOOLEAN DEFAULT TRUE,
                deleteFlag BOOLEAN DEFAULT FALSE,
                isDelinquent BOOLEAN DEFAULT FALSE,
                person_id INTEGER REFERENCES Person(person_id) ON DELETE CASCADE
            );
        `;

        const createPropertyTable = `
            CREATE TABLE IF NOT EXISTS Property(
                property_id SERIAL PRIMARY KEY,
                lot_number VARCHAR(20),
                property_type VARCHAR(10) NOT NULL,
                street_name VARCHAR(255),
                hasDues BOOLEAN DEFAULT FALSE,
                outstandingBalance DECIMAL(10, 2) DEFAULT 0.00
            );
        `;

        const createResidentPropertyTable = `
            CREATE TABLE IF NOT EXISTS Resident_Property(
                resident_id INTEGER REFERENCES Resident(resident_id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES Property(property_id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL,
                PRIMARY KEY(resident_id, property_id)
            );
        `;

        const createVehicleTable = `
            CREATE TABLE IF NOT EXISTS Vehicle(
                vehicle_id SERIAL PRIMARY KEY,
                type VARCHAR(20),
                plate_number VARCHAR(10),
                color VARCHAR(255) NOT NULL,
                make VARCHAR(255) NOT NULL,
                model VARCHAR(255) NOT NULL,
                sticker_year INTEGER,
                status VARCHAR(20) DEFAULT 'Active',
                hasSticker BOOLEAN DEFAULT FALSE
            );
        `;

        const createResidentVehicleTable = `
            CREATE TABLE IF NOT EXISTS Resident_Vehicle(
                resident_id INTEGER REFERENCES Resident(resident_id) ON DELETE CASCADE,
                vehicle_id INTEGER REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
                PRIMARY KEY(resident_id, vehicle_id)
            );
        `;

        const createBoardMemberTable = `
            CREATE TABLE IF NOT EXISTS Board_Member(
                board_id SERIAL PRIMARY KEY,
                position VARCHAR(100),
                board_start_date DATE,
                board_end_date DATE,
                resident_id INTEGER REFERENCES Resident(resident_id) ON DELETE CASCADE
            );
        `;

        const createRatesTable = `
            CREATE TABLE IF NOT EXISTS Rates(
                rate_id SERIAL PRIMARY KEY,
                rate_category VARCHAR(50) UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL
            );
        `;

        const createPaymentTable = `
            CREATE TABLE IF NOT EXISTS Payment(
                payment_id SERIAL PRIMARY KEY,
                purpose VARCHAR(50) NOT NULL,
                amount_expected DECIMAL(10, 2) DEFAULT 0.00,
                amount_paid DECIMAL(10, 2) DEFAULT 0.00,
                date_paid DATE,
                payment_method VARCHAR(50) NOT NULL,
                receipt_number VARCHAR(50),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_by INTEGER REFERENCES Person(person_id) ON DELETE SET NULL
            );
        `;

        const createOutstandingBalanceTable = `
            CREATE TABLE IF NOT EXISTS Outstanding_Balance(
                payment_id INTEGER PRIMARY KEY REFERENCES Payment(payment_id) ON DELETE CASCADE,
                property_id INTEGER REFERENCES Property(property_id) ON DELETE SET NULL,
                resident_id INTEGER REFERENCES Resident(resident_id) ON DELETE SET NULL
            );
        `;

        const createAssociationDuesTable = `
            CREATE TABLE IF NOT EXISTS Association_Dues(
                payment_id INTEGER PRIMARY KEY REFERENCES Payment(payment_id) ON DELETE CASCADE,
                is_annual BOOLEAN DEFAULT FALSE
            );
        `;

        const createPaymentVehicleTable = `
            CREATE TABLE IF NOT EXISTS Payment_Vehicle(
                payment_id INTEGER REFERENCES Payment(payment_id) ON DELETE CASCADE,
                vehicle_id INTEGER REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
                rate_applied VARCHAR(50) NOT NULL,
                PRIMARY KEY(payment_id, vehicle_id)
            );
        `;

        const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expenses(
                expense_id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                payor_id INTEGER NOT NULL,
                payor_type VARCHAR(50) NOT NULL,
                amount_expected DECIMAL(10, 2) DEFAULT 0.00,
                amount_paid DECIMAL(10, 2) DEFAULT 0.00,
                date_paid DATE NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                receipt_number VARCHAR(100),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createAdminTable = `
            CREATE TABLE IF NOT EXISTS Admin(
                admin_id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_num VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createBoardMemberAccountTable = `
            CREATE TABLE IF NOT EXISTS BoardMemberAccount(
                account_id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_num VARCHAR(100),
                board_member_id INTEGER REFERENCES Board_Member(board_id) ON DELETE SET NULL,
                isActive BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createHOASettingsTable = `
            CREATE TABLE IF NOT EXISTS HOA_Settings(
                id SERIAL PRIMARY KEY,
                hoa_name VARCHAR(255) DEFAULT 'HOA',
                hoa_address TEXT,
                hoa_email VARCHAR(255),
                hoa_contact_num VARCHAR(100),
                hoa_website VARCHAR(255),
                hoa_facebook VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const seedDefaultRatesTable = `
            INSERT INTO Rates (rate_category, amount) VALUES 
            ('Car', 600.00),
            ('Car (More than 6 stickers)', 1000.00),
            ('Motorcycle', 370.00),
            ('Commercial', 1000.00),
            ('House (Monthly Payment)', 800.00),
            ('Lot (Monthly Payment)', 200.00),
            ('House (Annual Payment)', 8800.00),
            ('Lot (Annual Payment)', 2200.00)
            ON CONFLICT (rate_category) DO NOTHING;
        `;

        // Execute all table creations
        await pool.query(createPersonTable);
        console.log("✅ Created Person table");

        await pool.query(createEmployeeTable);
        console.log("✅ Created Employee table");

        await pool.query(createResidentTable);
        console.log("✅ Created Resident table");

        await pool.query(createPropertyTable);
        console.log("✅ Created Property table");

        await pool.query(createResidentPropertyTable);
        console.log("✅ Created Resident_Property table");

        await pool.query(createVehicleTable);
        console.log("✅ Created Vehicle table");

        await pool.query(createResidentVehicleTable);
        console.log("✅ Created Resident_Vehicle table");

        await pool.query(createBoardMemberTable);
        console.log("✅ Created Board_Member table");

        await pool.query(createRatesTable);
        console.log("✅ Created Rates table");

        await pool.query(createPaymentTable);
        console.log("✅ Created Payment table");

        await pool.query(createOutstandingBalanceTable);
        console.log("✅ Created Outstanding_Balance table");

        await pool.query(createAssociationDuesTable);
        console.log("✅ Created Association_Dues table");

        await pool.query(createPaymentVehicleTable);
        console.log("✅ Created Payment_Vehicle table");

        await pool.query(createExpensesTable);
        console.log("✅ Created Expenses table");

        await pool.query(createAdminTable);
        console.log("✅ Created Admin table");

        await pool.query(createBoardMemberAccountTable);
        console.log("✅ Created BoardMemberAccount table");

        await pool.query(createHOASettingsTable);
        console.log("✅ Created HOA_Settings table");

        // Seed default rates
        await pool.query(seedDefaultRatesTable);
        console.log("✅ Seeded Rates with default values");

        // Seed default admin account
        try {
            const adminCheck = await pool.query('SELECT * FROM Admin LIMIT 1');
            if (adminCheck.rows.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(`
                    INSERT INTO Admin (username, password_hash, email, contact_num) 
                    VALUES ('admin', $1, 'admin@hoa.local', '09171234567')
                `, [hashedPassword]);
                console.log("✅ Default admin account created (username: admin, password: admin123)");
            } else {
                console.log("ℹ️ Admin account already exists");
            }
        } catch (err) {
            console.error('Error seeding admin account:', err.message);
        }

        // Seed default HOA settings
        try {
            const settingsCheck = await pool.query('SELECT * FROM HOA_Settings LIMIT 1');
            if (settingsCheck.rows.length === 0) {
                await pool.query(`
                    INSERT INTO HOA_Settings (hoa_name, hoa_email, hoa_contact_num) 
                    VALUES ('HOA', 'admin@hoa.local', '09171234567')
                `);
                console.log("✅ Default HOA settings created");
            }
        } catch (err) {
            console.error('Error seeding HOA settings:', err.message);
        }

        console.log("✅ All tables created successfully!");
        return true;

    } catch(err) {
        console.error('❌ Failed to create database tables:', err.message);
        throw err;
    }
};

module.exports = {
    pool,
    connectDB,
    createTables
};