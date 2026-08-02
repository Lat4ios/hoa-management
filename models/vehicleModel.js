const { pool } = require('../config/db');

const VehicleModel = {
    getAllVehicles: async () =>{
        const query = `
            SELECT v.type, v.vehicle_id, v.plate_number, v.make, v.model, v.color, v.sticker_year,
            v.status as raw_status,
            CASE 
                WHEN COUNT(r.resident_id) > 0 AND COALESCE(SUM(r.isActive), 0) = 0 THEN 'Inactive'
                ELSE v.status 
            END as status,
            GROUP_CONCAT(CONCAT(p.first_name, ' ', p.last_name) SEPARATOR ', ') AS homeowners,
            GROUP_CONCAT(rv.resident_id SEPARATOR ',') AS resident_ids 
            FROM Vehicle v
            LEFT JOIN Resident_Vehicle rv ON v.vehicle_id = rv.vehicle_id
            LEFT JOIN Resident r ON rv.resident_id = r.resident_id
            LEFT JOIN Person p ON r.person_id = p.person_id
            GROUP BY v.vehicle_id
        `;

        const [rows] = await pool.execute(query);
        return rows;
    },

    getAllVehiclesByResident: async(resident_id, conn) => {
        console.log("resident_id:", resident_id);
        console.log("conn exists:", !!conn);

        const [rows] = await conn.execute(`
            SELECT vehicle_id
            FROM Resident_Vehicle rv
            WHERE rv.resident_id = ?`,
            [resident_id]
        );

        return rows;
    },

    getAllResidents: async () => {
        const query = `
            SELECT r.resident_id, CONCAT(p.first_name, ' ', p.last_name) AS full_name 
            FROM Resident r 
            JOIN Person p ON r.person_id = p.person_id
            WHERE isActive = 1 AND deleteFlag = 0
        `;

        const [rows] = await pool.execute(query);
        return rows;
    },

    getVehicleById: async (vehicle_id, conn = pool) => {
        const [rows] = await conn.execute(
            'SELECT vehicle_id, type, plate_number, make, model, color, sticker_year, hasSticker FROM Vehicle WHERE vehicle_id = ?',
            [vehicle_id]
        );
        return rows[0] || null;
    },

    getVehiclesByIds: async (vehicleIds, conn = pool) => {
        if (!vehicleIds || vehicleIds.length === 0) return [];
        const placeholders = vehicleIds.map(() => '?').join(',');
        const [rows] = await conn.execute(
            `SELECT vehicle_id, type, plate_number, make, model, color, sticker_year, hasSticker
             FROM Vehicle WHERE vehicle_id IN (${placeholders})`,
            vehicleIds
        );
        return rows;
    },

    // Counts how many Car-type vehicles belonging to this resident already have
    // a sticker issued for the given year, excluding the given vehicle id(s) —
    // used to exclude the whole batch of vehicles currently being paid for,
    // since none of them have this year's sticker yet.
    countCarStickersForResident: async (resident_id, year, excludeVehicleIds, conn = pool) => {
        const excludeIds = Array.isArray(excludeVehicleIds) ? excludeVehicleIds : [excludeVehicleIds];
        const placeholders = excludeIds.length ? excludeIds.map(() => '?').join(',') : 'NULL';
        const [rows] = await conn.execute(
            `SELECT COUNT(*) AS carStickerCount
             FROM Resident_Vehicle rv
             JOIN Vehicle v ON v.vehicle_id = rv.vehicle_id
             WHERE rv.resident_id = ?
               AND v.type = 'Car'
               AND v.sticker_year = ?
               AND v.hasSticker = 1
               AND v.vehicle_id NOT IN (${placeholders})`,
            [resident_id, year, ...excludeIds]
        );
        return rows[0].carStickerCount;
    },

    markStickerIssued: async (vehicle_id, year, conn = pool) => {
        await conn.execute(
            'UPDATE Vehicle SET sticker_year = ?, hasSticker = 1 WHERE vehicle_id = ?',
            [year, vehicle_id]
        );
    },

    findByPlate: async (plate_number, conn = pool) =>{
        const [rows] = await conn.execute(
            'SELECT vehicle_id FROM vehicle WHERE plate_number = ?',
            [plate_number]
        );

        return rows;
    },

    createVehicle: async (vehicleData, conn = pool) =>{
        const { type, plate_number, make, model, color, sticker_year, status } = vehicleData;

        const [result] = await conn.execute(
            'INSERT INTO Vehicle (type, plate_number, make, model, color, sticker_year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [type, plate_number, make, model, color, sticker_year, status || 'Active']
        );

        return result.insertId;
    },

    updateVehicleData: async (vehicleId, vehicleData, conn = pool) =>{
        const { type, plate_number, make, model, color, sticker_year, status } = vehicleData;

        await conn.execute(
            `UPDATE Vehicle SET type = ?, plate_number = ?, make = ?, model = ?, color = ?, sticker_year = ?, status = ? WHERE vehicle_id = ?`,
            [type, plate_number, make, model, color, sticker_year, status, vehicleId]
        );
    },

    linkToResident: async (resident_id, vehicle_id) =>{
        await pool.execute(
            'INSERT INTO resident_vehicle (resident_id, vehicle_id) VALUES (?, ?)',
            [resident_id, vehicle_id]
        );
    },

    updateVehicleResidents: async (vehicleId, residentIds, conn = pool) => {
        await conn.execute('DELETE FROM Resident_Vehicle WHERE vehicle_id = ?', [vehicleId]);
        
        if (residentIds && residentIds.length > 0) {
            const insertQuery = 'INSERT INTO Resident_Vehicle (resident_id, vehicle_id) VALUES (?, ?)';
            for (const resId of residentIds) {
                await conn.execute(insertQuery, [resId, vehicleId]);
            }
        }
    },

    deleteVehicle: async (vehicleId) => {
        await pool.execute('DELETE FROM Vehicle WHERE vehicle_id = ?', [vehicleId]);
    },

    deleteResidentVehicle: async(resident_id, vehicle_id, conn) => {
        await conn.execute(`
            DELETE FROM Resident_Vehicle
            WHERE vehicle_id = ? AND resident_id = ?`,
            [vehicle_id, resident_id]
        )
    },
};

module.exports = VehicleModel;