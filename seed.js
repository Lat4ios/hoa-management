require('dotenv').config();
const { pool, createTables } = require('./config/db');

async function seed() {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // ── Clear existing data ───────────────────────────────────────────────
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE Outstanding_Balance');
        await conn.query('TRUNCATE TABLE Association_Dues');
        await conn.query('TRUNCATE TABLE Payment');
        await conn.query('TRUNCATE TABLE Resident_Vehicle');
        await conn.query('TRUNCATE TABLE Resident_Property');
        await conn.query('TRUNCATE TABLE Board_Member');
        await conn.query('TRUNCATE TABLE Resident');
        await conn.query('TRUNCATE TABLE Employee');
        await conn.query('TRUNCATE TABLE Vehicle');
        await conn.query('TRUNCATE TABLE Property');
        await conn.query('TRUNCATE TABLE Person');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // ── Persons ───────────────────────────────────────────────────────────
        // [first, last, middle, suffix, dob, email, contact]
        const persons = [
            // ── Residents (indices 0–35) ──────────────────────────────────────
            ['Clark',    'Kent',        'Jerome',      null,  '1978-06-18', 'clark.kent@dailyplanet.com',      '09171234501'],
            ['Lois',     'Lane',        'Marie',       null,  '1980-03-10', 'lois.lane@dailyplanet.com',       '09181234502'],
            ['Bruce',    'Wayne',       'Thomas',      null,  '1972-02-19', 'bruce.wayne@waynetech.com',       '09191234503'],
            ['Diana',    'Prince',      'Hippolyta',   null,  '1985-07-01', 'diana.prince@themyscira.com',     '09171234504'],
            ['Barry',    'Allen',       'Henry',       null,  '1990-09-30', 'barry.allen@ccpd.com',            '09181234505'],
            ['Arthur',   'Curry',       'Joseph',      null,  '1986-01-29', 'arthur.curry@atlantis.com',       '09191234506'],
            ['Hal',      'Jordan',      'Martin',      null,  '1982-02-20', 'hal.jordan@oa.com',               '09171234507'],
            ['Victor',   'Stone',       'Silas',       null,  '1995-06-29', 'victor.stone@star-labs.com',      '09181234508'],
            ['Oliver',   'Queen',       'Robert',      null,  '1975-05-16', 'oliver.queen@queencons.com',      '09191234509'],
            ['Zatanna',  'Zatara',      'Giovanni',    null,  '1988-11-05', 'zatanna@magicworldtour.com',      '09171234510'],
            ['John',     'Constantine', 'Francis',     null,  '1983-05-10', 'john.c@hellblazer.com',           '09181234511'],
            ['Selina',   'Kyle',        'Rose',        null,  '1979-03-17', 'selina.kyle@gotham.com',          '09191234512'],
            ['Kyle',     'Rayner',      'Philip',      null,  '1990-07-14', 'kyle.rayner@oa.com',              '09171234513'],
            ['Wally',    'West',        'Rudolph',     null,  '1993-11-11', 'wally.west@ccpd.com',             '09181234514'],
            ['Dick',     'Grayson',     'John',        null,  '1985-03-01', 'dick.grayson@bludhaven.com',      '09191234515'],
            ['Barbara',  'Gordon',      'Sandra',      null,  '1987-07-23', 'b.gordon@oracle.net',             '09171234516'],
            ['Jason',    'Todd',        'Willis',      null,  '1983-08-16', 'jason.todd@redhood.com',          '09181234517'],
            ['Tim',      'Drake',       'Jackson',     null,  '1998-07-19', 'tim.drake@redrobin.com',          '09191234518'],
            ['John',     'Stewart',     null,          'Jr.', '1978-12-05', 'john.stewart@oa.com',             '09171234519'],
            ['Kara',     'Zor-El',      null,          null,  '1995-10-30', 'kara@deo.gov',                    '09181234520'],
            ['John',     'Jones',       null,          null,  '1950-01-01', 'j.jones@mbisc.gov',               '09191234521'],
            ['Donna',    'Troy',        null,          null,  '1987-08-15', 'donna.troy@titans.com',           '09171234522'],
            ['Roy',      'Harper',      'James',       null,  '1991-06-17', 'roy.harper@arsenal.com',          '09181234523'],
            ['Rachel',   'Roth',        null,          null,  '1994-09-30', 'r.roth@titans.com',               '09191234524'],
            ['Kori',     'Anders',      null,          null,  '1992-06-15', 'kori.anders@titans.com',          '09171234525'],
            ['Garfield', 'Logan',       'Mark',        null,  '1999-09-22', 'gar.logan@titans.com',            '09181234526'],
            ['Dinah',    'Lance',       'Drake',       null,  '1982-04-06', 'dinah.lance@jla.com',             '09191234527'],
            ['Ted',      'Kord',        'Michael',     null,  '1975-11-18', 'ted.kord@kordind.com',            '09171234528'],
            ['Michael',  'Carter',      null,          null,  '1980-01-05', 'booster.gold@bwa.com',            '09181234529'],
            ['Ray',      'Palmer',      'David',       null,  '1972-03-22', 'r.palmer@ivy-u.edu',              '09191234530'],
            ['Mera',     'Curry',       null,          null,  '1984-02-14', 'mera@atlantis.com',               '09171234531'],
            ['Simon',    'Baz',         'Munir',       null,  '1990-02-22', 's.baz@oa.com',                    '09181234532'],
            ['Jessica',  'Cruz',        null,          null,  '1993-01-11', 'j.cruz@oa.com',                   '09191234533'],
            ['Carter',   'Hall',        null,          null,  '1965-09-17', 'c.hall@museum.com',               '09171234534'],
            ['Shayera',  'Hol',         null,          null,  '1970-04-28', 's.hol@hawkworld.com',             '09181234535'],
            ['Damian',   'Wayne',       null,          null,  '2006-09-06', 'd.wayne@waynetech.com',           '09191234536'],
            // ── Employees (indices 36–38) ─────────────────────────────────────
            ['Alfred',   'Pennyworth',  'Beagle',      null,  '1950-04-16', 'alfred@waynemanor.com',           '09171234537'],
            ['Amanda',   'Waller',      'Blake',       null,  '1965-11-22', 'a.waller@argus.gov',              '09181234538'],
            ['James',    'Gordon',      'Worthington', null,  '1960-08-05', 'j.gordon@gcpd.com',               '09191234539'],
        ];

        const personIds = [];
        for (const [first, last, middle, suffix, dob, email, contact] of persons) {
            const [r] = await conn.query(
                `INSERT INTO Person (first_name, last_name, middle_name, suffix, birth_date, email, contact_num)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [first, last, middle, suffix, dob, email, contact]
            );
            personIds.push(r.insertId);
        }

        // ── Residents ─────────────────────────────────────────────────────────
        // [personId, start, end, isActive, isDelinquent]
        // Delinquent indices: 9,10 (Alabastro 103), 12 (Coral 311),
        //                     13,14 (Nacar 730), 15 (Rubi 940), 16,17 (Zapiro 1152)
        const residentData = [
            [personIds[0],  '2015-01-10', null,         1, 0],  // 0  Clark Kent
            [personIds[1],  '2016-03-22', null,         1, 0],  // 1  Lois Lane
            [personIds[2],  '2018-06-15', null,         1, 0],  // 2  Bruce Wayne
            [personIds[3],  '2019-09-01', null,         1, 0],  // 3  Diana Prince
            [personIds[4],  '2010-04-30', null,         1, 0],  // 4  Barry Allen
            [personIds[5],  '2021-11-12', null,         1, 0],  // 5  Arthur Curry
            [personIds[6],  '2008-07-05', null,         1, 0],  // 6  Hal Jordan
            [personIds[7],  '2017-02-18', null,         1, 0],  // 7  Victor Stone
            [personIds[8],  '2013-08-27', null,         1, 0],  // 8  Oliver Queen
            [personIds[9],  '2020-05-09', null,         1, 1],  // 9  Zatanna (delinquent)
            [personIds[10], '2022-01-03', null,         1, 1],  // 10 Constantine (delinquent)
            [personIds[11], '2014-10-16', '2023-06-30', 0, 0],  // 11 Selina Kyle (ended)
            [personIds[12], '2019-03-15', null,         1, 1],  // 12 Kyle Rayner (delinquent)
            [personIds[13], '2021-08-01', null,         1, 1],  // 13 Wally West (delinquent)
            [personIds[14], '2020-11-20', null,         1, 1],  // 14 Dick Grayson (delinquent)
            [personIds[15], '2018-04-10', null,         1, 1],  // 15 Barbara Gordon (delinquent)
            [personIds[16], '2023-02-14', null,         1, 1],  // 16 Jason Todd (delinquent)
            [personIds[17], '2022-09-01', null,         1, 1],  // 17 Tim Drake (delinquent)
            [personIds[18], '2016-06-20', null,         1, 0],  // 18 John Stewart
            [personIds[19], '2023-01-15', null,         1, 0],  // 19 Kara Zor-El
            [personIds[20], '2011-03-09', null,         1, 0],  // 20 John Jones
            [personIds[21], '2020-07-04', null,         1, 0],  // 21 Donna Troy
            [personIds[22], '2019-12-25', null,         1, 0],  // 22 Roy Harper
            [personIds[23], '2021-04-17', null,         1, 0],  // 23 Rachel Roth
            [personIds[24], '2021-04-17', null,         1, 0],  // 24 Kori Anders
            [personIds[25], '2022-06-01', null,         1, 0],  // 25 Garfield Logan
            [personIds[26], '2017-09-10', null,         1, 0],  // 26 Dinah Lance
            [personIds[27], '2015-05-22', null,         1, 0],  // 27 Ted Kord
            [personIds[28], '2015-05-22', null,         1, 0],  // 28 Michael Carter
            [personIds[29], '2012-11-30', null,         1, 0],  // 29 Ray Palmer
            [personIds[30], '2021-11-12', null,         1, 0],  // 30 Mera Curry
            [personIds[31], '2020-08-08', null,         1, 0],  // 31 Simon Baz
            [personIds[32], '2023-03-20', null,         1, 0],  // 32 Jessica Cruz
            [personIds[33], '2009-01-01', null,         1, 0],  // 33 Carter Hall
            [personIds[34], '2009-01-01', null,         1, 0],  // 34 Shayera Hol
            [personIds[35], '2023-09-06', null,         1, 0],  // 35 Damian Wayne
        ];

        const residentIds = [];
        for (const [personId, start, end, isActive, isDelinquent] of residentData) {
            const [r] = await conn.query(
                `INSERT INTO Resident (person_id, residency_start_date, residency_end_date, isActive, isDelinquent)
                 VALUES (?, ?, ?, ?, ?)`,
                [personId, start, end, isActive, isDelinquent]
            );
            residentIds.push(r.insertId);
        }

        // ── Properties (42 total) ─────────────────────────────────────────────
        // [lot, type, street, hasDues, outstandingBalance]
        // Streets: Alabastro(5) Cameo(4) Coral(4) Diamante(4) Esmeralda(4)
        //          Maharlika(4) Nacar(4) Perla(3) Rubi(3) Topacio(4) Zapiro(3) = 42
        const properties = [
            // ── Alabastro (5) ─────────────────────────────────────────────────
            ['101', 'House', 'Alabastro',  0,    0.00],   //  0 — Clark Kent, Lois Lane
            ['102', 'House', 'Alabastro',  0,    0.00],   //  1 — Bruce Wayne, Damian Wayne
            ['103', 'House', 'Alabastro',  1, 4800.00],   //  2 — Zatanna, Constantine (DELINQUENT)
            ['104', 'Lot',   'Alabastro',  0,    0.00],   //  3 — Selina Kyle (ended)
            ['105', 'House', 'Alabastro',  0,    0.00],   //  4 — vacant
            // ── Cameo (4) ─────────────────────────────────────────────────────
            ['205', 'House', 'Cameo',      0,    0.00],   //  5 — Diana Prince
            ['206', 'House', 'Cameo',      0,    0.00],   //  6 — Barry Allen
            ['207', 'House', 'Cameo',      0,    0.00],   //  7 — Dinah Lance
            ['208', 'Lot',   'Cameo',      0,    0.00],   //  8 — vacant
            // ── Coral (4) ─────────────────────────────────────────────────────
            ['310', 'House', 'Coral',      0,    0.00],   //  9 — Arthur Curry, Mera
            ['311', 'House', 'Coral',      1, 2400.00],   // 10 — Kyle Rayner (DELINQUENT)
            ['312', 'House', 'Coral',      0,    0.00],   // 11 — Simon Baz
            ['313', 'Lot',   'Coral',      0,    0.00],   // 12 — vacant
            // ── Diamante (4) ──────────────────────────────────────────────────
            ['415', 'House', 'Diamante',   0,    0.00],   // 13 — Hal Jordan
            ['416', 'Lot',   'Diamante',   0,    0.00],   // 14 — John Stewart
            ['417', 'House', 'Diamante',   0,    0.00],   // 15 — Victor Stone
            ['418', 'House', 'Diamante',   0,    0.00],   // 16 — vacant
            // ── Esmeralda (4) ─────────────────────────────────────────────────
            ['520', 'House', 'Esmeralda',  0,    0.00],   // 17 — Oliver Queen
            ['521', 'House', 'Esmeralda',  0,    0.00],   // 18 — Ray Palmer
            ['522', 'House', 'Esmeralda',  0,    0.00],   // 19 — Kara Zor-El
            ['523', 'Lot',   'Esmeralda',  0,    0.00],   // 20 — John Jones
            // ── Maharlika (4) ─────────────────────────────────────────────────
            ['625', 'House', 'Maharlika',  0,    0.00],   // 21 — Donna Troy
            ['626', 'House', 'Maharlika',  0,    0.00],   // 22 — Roy Harper
            ['627', 'Lot',   'Maharlika',  0,    0.00],   // 23 — vacant
            ['628', 'House', 'Maharlika',  0,    0.00],   // 24 — vacant
            // ── Nacar (4) ─────────────────────────────────────────────────────
            ['730', 'House', 'Nacar',      1, 9600.00],   // 25 — Wally West, Dick Grayson (DELINQUENT)
            ['731', 'House', 'Nacar',      0,    0.00],   // 26 — Jessica Cruz
            ['732', 'Lot',   'Nacar',      0,    0.00],   // 27 — vacant
            ['733', 'House', 'Nacar',      0,    0.00],   // 28 — vacant
            // ── Perla (3) ─────────────────────────────────────────────────────
            ['835', 'House', 'Perla',      0,    0.00],   // 29 — Carter Hall, Shayera Hol
            ['836', 'House', 'Perla',      0,    0.00],   // 30 — vacant
            ['837', 'Lot',   'Perla',      0,    0.00],   // 31 — vacant
            // ── Rubi (3) ──────────────────────────────────────────────────────
            ['940', 'House', 'Rubi',       1, 1600.00],   // 32 — Barbara Gordon (DELINQUENT, partial paid)
            ['941', 'House', 'Rubi',       0,    0.00],   // 33 — Ted Kord, Michael Carter
            ['942', 'Lot',   'Rubi',       0,    0.00],   // 34 — vacant
            // ── Topacio (4) ───────────────────────────────────────────────────
            ['1045', 'House', 'Topacio',   0,    0.00],   // 35 — Rachel Roth, Kori Anders
            ['1046', 'House', 'Topacio',   0,    0.00],   // 36 — Garfield Logan
            ['1047', 'Lot',   'Topacio',   0,    0.00],   // 37 — vacant
            ['1048', 'House', 'Topacio',   0,    0.00],   // 38 — vacant
            // ── Zapiro (3) ────────────────────────────────────────────────────
            ['1150', 'House', 'Zapiro',    0,    0.00],   // 39 — vacant
            ['1151', 'Lot',   'Zapiro',    0,    0.00],   // 40 — vacant
            ['1152', 'House', 'Zapiro',    1, 7200.00],   // 41 — Jason Todd, Tim Drake (DELINQUENT)
        ];

        const propertyIds = [];
        for (const [lot, type, street, hasDues, outstanding] of properties) {
            const [r] = await conn.query(
                `INSERT INTO Property (lot_number, property_type, street_name, hasDues, outstandingBalance)
                 VALUES (?, ?, ?, ?, ?)`,
                [lot, type, street, hasDues, outstanding]
            );
            propertyIds.push(r.insertId);
        }

        // ── Resident_Property ─────────────────────────────────────────────────
        const residentProperties = [
            // Alabastro
            [residentIds[0],  propertyIds[0],  'Homeowner'],  // Clark Kent → 101
            [residentIds[1],  propertyIds[0],  'Relative'],   // Lois Lane → 101
            [residentIds[2],  propertyIds[1],  'Homeowner'],  // Bruce Wayne → 102
            [residentIds[35], propertyIds[1],  'Relative'],   // Damian Wayne → 102
            [residentIds[9],  propertyIds[2],  'Homeowner'],  // Zatanna → 103 (delinquent)
            [residentIds[10], propertyIds[2],  'Relative'],   // Constantine → 103 (delinquent)
            [residentIds[11], propertyIds[3],  'Homeowner'],  // Selina Kyle → 104 (ended)
            // Cameo
            [residentIds[3],  propertyIds[5],  'Homeowner'],  // Diana Prince → 205
            [residentIds[4],  propertyIds[6],  'Homeowner'],  // Barry Allen → 206
            [residentIds[26], propertyIds[7],  'Homeowner'],  // Dinah Lance → 207
            // Coral
            [residentIds[5],  propertyIds[9],  'Homeowner'],  // Arthur Curry → 310
            [residentIds[30], propertyIds[9],  'Relative'],   // Mera Curry → 310
            [residentIds[12], propertyIds[10], 'Homeowner'],  // Kyle Rayner → 311 (delinquent)
            [residentIds[31], propertyIds[11], 'Homeowner'],  // Simon Baz → 312
            // Diamante
            [residentIds[6],  propertyIds[13], 'Homeowner'],  // Hal Jordan → 415
            [residentIds[18], propertyIds[14], 'Homeowner'],  // John Stewart → 416
            [residentIds[7],  propertyIds[15], 'Homeowner'],  // Victor Stone → 417
            // Esmeralda
            [residentIds[8],  propertyIds[17], 'Homeowner'],  // Oliver Queen → 520
            [residentIds[29], propertyIds[18], 'Homeowner'],  // Ray Palmer → 521
            [residentIds[19], propertyIds[19], 'Homeowner'],  // Kara Zor-El → 522
            [residentIds[20], propertyIds[20], 'Homeowner'],  // John Jones → 523
            // Maharlika
            [residentIds[21], propertyIds[21], 'Homeowner'],  // Donna Troy → 625
            [residentIds[22], propertyIds[22], 'Homeowner'],  // Roy Harper → 626
            // Nacar
            [residentIds[13], propertyIds[25], 'Homeowner'],  // Wally West → 730 (delinquent)
            [residentIds[14], propertyIds[25], 'Relative'],   // Dick Grayson → 730 (delinquent)
            [residentIds[32], propertyIds[26], 'Homeowner'],  // Jessica Cruz → 731
            // Perla
            [residentIds[33], propertyIds[29], 'Homeowner'],  // Carter Hall → 835
            [residentIds[34], propertyIds[29], 'Relative'],   // Shayera Hol → 835
            // Rubi
            [residentIds[15], propertyIds[32], 'Homeowner'],  // Barbara Gordon → 940 (delinquent)
            [residentIds[27], propertyIds[33], 'Homeowner'],  // Ted Kord → 941
            [residentIds[28], propertyIds[33], 'Relative'],   // Michael Carter → 941
            // Topacio
            [residentIds[23], propertyIds[35], 'Homeowner'],  // Rachel Roth → 1045
            [residentIds[24], propertyIds[35], 'Relative'],   // Kori Anders → 1045
            [residentIds[25], propertyIds[36], 'Homeowner'],  // Garfield Logan → 1046
            // Zapiro
            [residentIds[16], propertyIds[41], 'Homeowner'],  // Jason Todd → 1152 (delinquent)
            [residentIds[17], propertyIds[41], 'Relative'],   // Tim Drake → 1152 (delinquent)
        ];

        for (const [resId, propId, type] of residentProperties) {
            await conn.query(
                `INSERT INTO Resident_Property (resident_id, property_id, type) VALUES (?, ?, ?)`,
                [resId, propId, type]
            );
        }

        // ── Board Members ─────────────────────────────────────────────────────
        const boardMembers = [
            [residentIds[0],  'President',      '2022-01-01', null],         // Clark Kent
            [residentIds[3],  'Vice President', '2022-01-01', null],         // Diana Prince
            [residentIds[4],  'Treasurer',      '2022-01-01', null],         // Barry Allen
            [residentIds[26], 'Admin',          '2022-01-01', null],         // Dinah Lance
            [residentIds[2],  'Board Member',   '2022-01-01', null],         // Bruce Wayne
            [residentIds[6],  'Board Member',   '2020-01-01', '2021-12-31'], // Hal Jordan (past term)
        ];

        for (const [resId, position, start, end] of boardMembers) {
            await conn.query(
                `INSERT INTO Board_Member (resident_id, position, board_start_date, board_end_date) VALUES (?, ?, ?, ?)`,
                [resId, position, start, end]
            );
        }

        // ── Employees ─────────────────────────────────────────────────────────
        const employees = [
            [personIds[36], 18000.00, 'Security Guard', '2019-06-01', null],
            [personIds[37], 22000.00, 'Secretary',      '2020-03-15', null],
            [personIds[38], 20000.00, 'Maintenance',    '2018-09-01', null],
        ];

        for (const [personId, salary, position, start, end] of employees) {
            await conn.query(
                `INSERT INTO Employee (person_id, salary, position, employee_start_date, employee_end_date)
                 VALUES (?, ?, ?, ?, ?)`,
                [personId, salary, position, start, end]
            );
        }

        // ── Vehicles ──────────────────────────────────────────────────────────
        // [type, plate, color, make, model, year]
        const vehicles = [
            ['Car',        'ABC 1234', 'White',  'Toyota',      'Vios',       2023],
            ['Car',        'XYZ 5678', 'Black',  'Honda',       'City',       2022],
            ['Motorcycle', 'MTR 001',  'Red',    'Yamaha',      'Mio',        2021],
            ['Car',        'DEF 9012', 'Silver', 'Mitsubishi',  'Montero',    2023],
            ['E-Bike',     null,       'Blue',   'Generic',     'E-Bike',     2022],
            ['Car',        'GHI 3456', 'Gray',   'BMW',         '3 Series',   2022],
            ['Car',        'JKL 7890', 'White',  'Ford',        'Ranger',     2021],
            ['Car',        'MNO 2345', 'Black',  'Toyota',      'Land Cruiser',2023],
            ['Motorcycle', 'PQR 6789', 'Red',    'Suzuki',      'Raider',     2022],
            ['Car',        'STU 0123', 'Pearl',  'Honda',       'Accord',     2023],
        ];

        const vehicleIds = [];
        for (const [type, plate, color, make, model, year] of vehicles) {
            const [r] = await conn.query(
                `INSERT INTO Vehicle (type, plate_number, color, make, model, sticker_year) VALUES (?, ?, ?, ?, ?, ?)`,
                [type, plate, color, make, model, year]
            );
            vehicleIds.push(r.insertId);
        }

        // ── Resident_Vehicle ──────────────────────────────────────────────────
        const residentVehicles = [
            [residentIds[0],  vehicleIds[0]],  // Clark Kent → Vios
            [residentIds[2],  vehicleIds[1]],  // Bruce Wayne → Honda City
            [residentIds[4],  vehicleIds[2]],  // Barry Allen → Yamaha Mio
            [residentIds[8],  vehicleIds[3]],  // Oliver Queen → Montero
            [residentIds[7],  vehicleIds[4]],  // Victor Stone → E-Bike
            [residentIds[6],  vehicleIds[5]],  // Hal Jordan → BMW
            [residentIds[5],  vehicleIds[6]],  // Arthur Curry → Ford Ranger
            [residentIds[2],  vehicleIds[7]],  // Bruce Wayne → Land Cruiser (2 vehicles)
            [residentIds[22], vehicleIds[8]],  // Roy Harper → Suzuki Raider
            [residentIds[27], vehicleIds[9]],  // Ted Kord → Honda Accord
        ];

        for (const [resId, vehId] of residentVehicles) {
            await conn.query(
                `INSERT INTO Resident_Vehicle (resident_id, vehicle_id) VALUES (?, ?)`,
                [resId, vehId]
            );
        }

        // ── Payments ──────────────────────────────────────────────────────────
        // [purpose, expected, paid, date, method, receipt, remarks, personIdx]
        const payments = [
            // Association Dues — paid in full
            ['Association Dues',    800.00,  800.00, '2025-01-15', 'GCash',         'OR-2025-001', 'Monthly Jan — Clark Kent',          0],
            ['Association Dues',    800.00,  800.00, '2025-02-14', 'Cash',          'OR-2025-002', 'Monthly Feb — Clark Kent',          0],
            ['Association Dues',    800.00,  800.00, '2025-03-10', 'Bank Transfer', 'OR-2025-003', 'Monthly Mar — Bruce Wayne',         2],
            ['Association Dues',    800.00,  800.00, '2025-04-12', 'GCash',         'OR-2025-004', 'Monthly Apr — Diana Prince',        3],
            ['Association Dues',    800.00,  800.00, '2025-05-08', 'Maya',          'OR-2025-005', 'Monthly May — Barry Allen',         4],
            ['Association Dues',   8800.00, 8800.00, '2025-01-05', 'Check',         'OR-2025-006', 'Annual — Oliver Queen',             8],
            ['Association Dues',    800.00,  800.00, '2025-03-20', 'Cash',          'OR-2025-007', 'Monthly Mar — Dinah Lance',        26],
            // Association Dues — partially paid / unpaid
            ['Association Dues',    800.00,    0.00, '2025-06-01', 'Cash',          null,          'Pending — Lois Lane',               1],
            ['Association Dues',    800.00,  400.00, '2025-05-15', 'GCash',         'OR-2025-008', 'Partial — Arthur Curry',            5],
            // Vehicle Stickers
            ['Vehicle Sticker',     600.00,  600.00, '2025-01-20', 'Cash',          'OR-2025-009', 'Sticker — ABC 1234 (Vios)',          0],
            ['Vehicle Sticker',     600.00,  600.00, '2025-01-22', 'GCash',         'OR-2025-010', 'Sticker — XYZ 5678 (City)',         2],
            ['Vehicle Sticker',     370.00,  370.00, '2025-02-05', 'Cash',          'OR-2025-011', 'Sticker — MTR 001 (Mio)',           4],
            ['Vehicle Sticker',     600.00,  600.00, '2025-01-18', 'Bank Transfer', 'OR-2025-012', 'Sticker — GHI 3456 (BMW)',          6],
            ['Vehicle Sticker',    1000.00, 1000.00, '2025-02-10', 'Bank Transfer', 'OR-2025-013', 'Sticker — MNO 2345 (Land Cruiser)', 2],
            ['Vehicle Sticker',     600.00,  600.00, '2025-01-25', 'Cash',          'OR-2025-014', 'Sticker — STU 0123 (Accord)',       27],
            // Outstanding Balance payments (history)
            // Lot 940 Rubi — Barbara Gordon originally owed 3200; paid 1600; still owes 1600
            ['Outstanding Balance', 3200.00, 1600.00, '2025-03-01', 'Cash',          'OR-2025-015', 'Partial payment on 940 Rubi dues', 15],
            // Lot 311 Coral — Kyle Rayner full balance still owed, first notice sent
            ['Outstanding Balance', 2400.00,    0.00, '2025-04-10', 'Cash',          null,          'Unpaid — 311 Coral first notice',  12],
            // General Payments
            ['General Payments',    500.00,  500.00, '2025-05-20', 'Cash',          'OR-2025-016', 'Gate pass fee — Zatanna',           9],
            ['General Payments',    200.00,  200.00, '2025-06-05', 'GCash',         'OR-2025-017', 'Basketball court rental',          26],
            ['General Payments',   1500.00, 1500.00, '2025-04-28', 'Bank Transfer', 'OR-2025-018', 'Construction bond — Bruce Wayne',   2],
        ];

        const paymentIds = [];
        for (const [purpose, expected, paid, date, method, receipt, remarks, personIdx] of payments) {
            const [r] = await conn.query(
                `INSERT INTO Payment (purpose, amount_expected, amount_paid, date_paid, payment_method, receipt_number, remarks, paid_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [purpose, expected, paid, date, method, receipt, remarks, personIds[personIdx]]
            );
            paymentIds.push(r.insertId);
        }

        // ── Outstanding_Balance records (for the payments above) ──────────────
        // partial payment on Lot 940 Rubi (payment index 15 in payments array → paymentIds[15])
        await conn.query(
            `INSERT INTO Outstanding_Balance (payment_id, property_id, resident_id) VALUES (?, ?, ?)`,
            [paymentIds[15], propertyIds[32], residentIds[15]]
        );
        // unpaid record for Lot 311 Coral (payment index 16)
        await conn.query(
            `INSERT INTO Outstanding_Balance (payment_id, property_id, resident_id) VALUES (?, ?, ?)`,
            [paymentIds[16], propertyIds[10], residentIds[12]]
        );

        await conn.commit();
        console.log('✓ Seed complete.');
        console.log(`  ${persons.length} persons (${residentData.length} residents + 3 employees)`);
        console.log(`  ${propertyIds.length} properties (5 with outstanding dues)`);
        console.log(`  ${residentProperties.length} resident-property links`);
        console.log(`  ${boardMembers.length} board member records`);
        console.log(`  ${vehicleIds.length} vehicles`);
        console.log(`  ${paymentIds.length} payments`);
        console.log('');
        console.log('  Delinquent properties:');
        console.log('    103 Alabastro — ₱4,800  (Zatanna Zatara, John Constantine)');
        console.log('    311 Coral     — ₱2,400  (Kyle Rayner)');
        console.log('    730 Nacar     — ₱9,600  (Wally West, Dick Grayson)');
        console.log('    940 Rubi      — ₱1,600  (Barbara Gordon — partially paid)');
        console.log('    1152 Zapiro   — ₱7,200  (Jason Todd, Tim Drake)');

    } catch (err) {
        await conn.rollback();
        console.error('Seed failed:', err.message);
        console.error(err);
    } finally {
        conn.release();
        await pool.end();
    }
}

createTables().then(seed);
