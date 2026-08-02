const mysql = require('mysql2');
require('dotenv').config();
const bcrypt = require('bcrypt');

const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hoa_db',
    port: process.env.DB_PORT || 3306,
    dateStrings: true,
    // Clever Cloud requires SSL
    ssl: isProduction ? {
        rejectUnauthorized: false
    } : undefined,
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
}).promise();

const connectDB = async() => {
    try{
        const conn = await pool.getConnection();
        console.log("✅ Successfully connected to MySQL database!");
        conn.release();
        return true;
    }catch(err) {
        console.error('❌ Database connection failed!', err.message);
        console.error('📌 Please check your database credentials');
        return false;
    }
};

const createTables = async() => {
    try {
        const createPersonTable = `
            CREATE TABLE IF NOT EXISTS Person(
                person_id int AUTO_INCREMENT PRIMARY KEY, 
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR (255) NOT NULL, 
                middle_name VARCHAR(255), 
                suffix VARCHAR(50),
                birth_date DATE,
                email VARCHAR (255),
                contact_num VARCHAR(100)
            );
        `;

        const createEmployeeTable = `
            CREATE TABLE IF NOT EXISTS Employee(
                employee_id INT AUTO_INCREMENT PRIMARY KEY, 
                salary DECIMAL(10, 2),
                position ENUM('Security Guard', 'Maintenance', 'Bookkeeper', 'Secretary', 'Others') NOT NULL,
                employee_start_date DATE,
                employee_end_date DATE,

                person_id INT,
                FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE
            );
        `;

        const createResidentTable = `
            CREATE TABLE IF NOT EXISTS Resident(
                resident_id INT AUTO_INCREMENT PRIMARY KEY, 
                residency_start_date DATE,
                residency_end_date DATE,
                isActive BOOLEAN NOT NULL DEFAULT 1,
                deleteFlag BOOLEAN NOT NULL DEFAULT 0,

                person_id INT,
                FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE
            );
        `;

        const createPropertyTable = `
            CREATE TABLE IF NOT EXISTS Property(
                property_id INT AUTO_INCREMENT PRIMARY KEY,
                lot_number  VARCHAR(20),
                property_type ENUM("House", "Lot") NOT NULL,
                street_name VARCHAR(255)
            );
        `;

        const createResidentPropertyTable = `
            CREATE TABLE IF NOT EXISTS Resident_Property(
                resident_id INT,
                property_id INT,

                type ENUM ("Homeowner", "Relative", "Helper", "Others", "Lessee") NOT NULL,

                PRIMARY KEY(resident_id, property_id),
                FOREIGN KEY (resident_id) REFERENCES Resident(resident_id) ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES Property(property_id) ON DELETE CASCADE
            );
        `;

        const createVehicleTable = `
            CREATE TABLE IF NOT EXISTS Vehicle (
                vehicle_id INT AUTO_INCREMENT PRIMARY KEY, 
                type ENUM("Car", "Motorcycle", "E-Bike", "Commercial", "Others"),
                plate_number VARCHAR(10),
                color VARCHAR(255) NOT NULL,
                make VARCHAR(255) NOT NULL,
                model VARCHAR(255) NOT NULL,
                sticker_year YEAR,
                status ENUM('Active', 'Inactive') DEFAULT 'Active'
            );
        `;

        const createResidentVehicleTable = `
            CREATE TABLE IF NOT EXISTS Resident_Vehicle(
                resident_id INT,
                vehicle_id INT,

                PRIMARY KEY(resident_id, vehicle_id),
                FOREIGN KEY (resident_id) REFERENCES Resident(resident_id) ON DELETE CASCADE,
                FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE
            );
        `;

        const createBoardMemberTable = `
            CREATE TABLE IF NOT EXISTS Board_Member(
                board_id INT AUTO_INCREMENT PRIMARY KEY, 
                position VARCHAR(100),
                board_start_date DATE,
                board_end_date DATE,

                resident_id INT,
                FOREIGN KEY (resident_id) REFERENCES Resident(resident_id) ON DELETE CASCADE
            );        
        `;

        const createRatesTable = `
            CREATE TABLE IF NOT EXISTS Rates (
                rate_id INT AUTO_INCREMENT PRIMARY KEY,
                rate_category ENUM(
                    'Car',
                    'Car (More than 6 stickers)',
                    'Motorcycle',
                    'Commercial',
                    'House (Monthly Payment)',
                    'Lot (Monthly Payment)',
                    'House (Annual Payment)',
                    'Lot (Annual Payment)'
                ) NOT NULL UNIQUE,
                amount DECIMAL(10, 2) NOT NULL
            );
        `;

        const createPaymentTable = `
            CREATE TABLE IF NOT EXISTS Payment (
                payment_id      INT AUTO_INCREMENT PRIMARY KEY,
                purpose         ENUM(
                                    'Vehicle Sticker',
                                    'Association Dues',
                                    'Outstanding Balance',
                                    'General Payments'
                                ) NOT NULL,
                amount_expected DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                amount_paid     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                date_paid       DATE,
                payment_method  ENUM('Cash', 'Check', 'Bank Transfer', 'GCash', 'Maya') NOT NULL,
                receipt_number  VARCHAR(50),
                remarks         TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                paid_by         INT,
                FOREIGN KEY (paid_by) REFERENCES Person(person_id) ON DELETE SET NULL
            );
        `;

        const createOutstandingBalanceTable = `
            CREATE TABLE IF NOT EXISTS Outstanding_Balance (
                payment_id  INT PRIMARY KEY,
                property_id INT,
                resident_id INT,

                FOREIGN KEY (payment_id)  REFERENCES Payment(payment_id)   ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES Property(property_id)  ON DELETE SET NULL,
                FOREIGN KEY (resident_id) REFERENCES Resident(resident_id)  ON DELETE SET NULL
            );
        `;

        const createAssociationDuesTable = `
            CREATE TABLE IF NOT EXISTS Association_Dues (
                payment_id INT PRIMARY KEY,
                is_annual  BOOLEAN NOT NULL DEFAULT 0,

                FOREIGN KEY (payment_id) REFERENCES Payment(payment_id) ON DELETE CASCADE
            );
        `;

        const createPaymentVehicleTable = `
            CREATE TABLE IF NOT EXISTS Payment_Vehicle (
                payment_id   INT,
                vehicle_id   INT,
                rate_applied ENUM(
                                 'Car',
                                 'Car (More than 6 stickers)',
                                 'Motorcycle',
                                 'Commercial'
                             ) NOT NULL,

                PRIMARY KEY (payment_id, vehicle_id),
                FOREIGN KEY (payment_id) REFERENCES Payment(payment_id) ON DELETE CASCADE,
                FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE
            );
        `;

        const seedDefaultRatesTable = `
            INSERT IGNORE INTO Rates (rate_category, amount) VALUES 
            ('Car', 600.00),
            ('Car (More than 6 stickers)', 1000.00),
            ('Motorcycle', 370.00),
            ('Commercial', 1000.00),
            ('House (Monthly Payment)', 800.00),
            ('Lot (Monthly Payment)', 200.00),
            ('House (Annual Payment)', 8800.00),
            ('Lot (Annual Payment)', 2200.00);
        `;

        const createExpensesTable = `
            CREATE TABLE IF NOT EXISTS expenses (
                expense_id INT AUTO_INCREMENT PRIMARY KEY,
                category ENUM('utilities', 'employee salaries', 'maintenance', 'petty cash', 'food', 'community project', 'other') NOT NULL,
                
                payor_id INT NOT NULL,
                payor_type ENUM('Resident', 'Board Member', 'Employee') NOT NULL,

                amount_expected DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                date_paid DATE NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                receipt_number VARCHAR(100),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        const createAdminTable = `
            CREATE TABLE IF NOT EXISTS Admin (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_num VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        const createBoardMemberAccountTable = `
            CREATE TABLE IF NOT EXISTS BoardMemberAccount (
                account_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                contact_num VARCHAR(100),
                board_member_id INT,
                isActive BOOLEAN DEFAULT 1,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (board_member_id) REFERENCES Board_Member(board_id) ON DELETE SET NULL
            );
        `;

        const createHOASettingsTable = `
            CREATE TABLE IF NOT EXISTS HOA_Settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hoa_name VARCHAR(255) DEFAULT 'HOA',
                hoa_address TEXT,
                hoa_email VARCHAR(255),
                hoa_contact_num VARCHAR(100),
                hoa_website VARCHAR(255),
                hoa_facebook VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `;

        await pool.query(createPersonTable);
        console.log("Successfully created Person table!")

        await pool.query(createEmployeeTable);
        console.log("Successfully created Employee table!")

        await pool.query(createResidentTable);
        console.log("Successfully created Resident table!")

        await pool.query(createPropertyTable);
        console.log("Successfully created Property table!")

        await pool.query(createResidentPropertyTable);
        console.log("Successfully created Resident_Property table!")

        await pool.query(createVehicleTable);
        console.log("Successfully created Vehicle table!")

        await pool.query(createResidentVehicleTable);
        console.log("Successfully created Resident_Vehicle table!")

        await pool.query(createBoardMemberTable);
        console.log("Successfully created Board_Member table!")

        await pool.query(createRatesTable);
        console.log("Successfully created Rates table!")

        await pool.query(seedDefaultRatesTable);
        console.log("Successfully seeded Rates with default values!")

        await pool.query(createPaymentTable);
        console.log("Successfully created Payment table!")

        await pool.query(createOutstandingBalanceTable);
        console.log("Successfully created Outstanding_Balance table!")

        await pool.query(createAssociationDuesTable);
        console.log("Successfully created Association_Dues table!")

        await pool.query(createPaymentVehicleTable);
        console.log("Successfully created Payment_Vehicle table!")

        await pool.query(createExpensesTable);
        console.log("Successfully created Expenses table!")

        await pool.query(createAdminTable);
        console.log("Successfully created Admin table!")

        await pool.query(createBoardMemberAccountTable);
        console.log("Successfully created BoardMemberAccount table!")

        await pool.query(createHOASettingsTable);
        console.log("Successfully created HOA_Settings table!")

        try {
            const [adminCheck] = await pool.query('SELECT * FROM Admin LIMIT 1');
            if (adminCheck.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.query(`
                    INSERT INTO Admin (username, password_hash, email, contact_num) 
                    VALUES ('admin', ?, 'admin@hoa.local', '09171234567')
                `, [hashedPassword]);
                console.log("Default admin account created (username: admin, password: admin123)");
            }
        } catch (err) {
            console.error('Error seeding admin account:', err);
        }

        try {
            const [settingsCheck] = await pool.query('SELECT * FROM HOA_Settings LIMIT 1');
            if (settingsCheck.length === 0) {
                await pool.query(`
                    INSERT INTO HOA_Settings (hoa_name, hoa_email, hoa_contact_num) 
                    VALUES ('HOA', 'admin@hoa.local', '09171234567')
                `);
                console.log("Default HOA settings created");
            }
        } catch (err) {
            console.error('Error seeding HOA settings:', err);
        }

        const dbName = process.env.DB_NAME || 'hoa_db';
        const missingColumns = [
            { table: 'Person',   column: 'birth_date',         definition: 'DATE',                              after: 'suffix'       },
            { table: 'Property', column: 'lot_number',          definition: 'VARCHAR(20)',                        after: 'property_id'  },
            { table: 'Resident', column: 'isDelinquent',        definition: 'BOOLEAN NOT NULL DEFAULT 0',         after: 'deleteFlag'   },
            { table: 'Property', column: 'hasDues',             definition: 'BOOLEAN NOT NULL DEFAULT 0',         after: 'street_name'  },
            { table: 'Property', column: 'outstandingBalance',  definition: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',after: 'hasDues'      },
            { table: 'Vehicle',  column: 'hasSticker',          definition: 'BOOLEAN NOT NULL DEFAULT 0',         after: 'sticker_year' },
        ];

        for (const { table, column, definition, after } of missingColumns) {
            const [[{ cnt }]] = await pool.query(
                `SELECT COUNT(*) AS cnt
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [dbName, table, column]
            );
            if (cnt === 0) {
                await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition} AFTER \`${after}\``);
                console.log(`Migration: added ${column} to ${table}`);
            }
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