import 'dotenv/config';
import { getDb, sql } from './sql.js';
import { hashPassword } from '../utils/password.js';

async function main() {
  console.log('🌱 Seeding database...');
  const db = await getDb();

  const users = [
    { username: 'admin',      password: 'admin123',  role: 'admin',                    name: 'System Admin' },
    { username: 'requester',  password: 'req123',    role: 'requester',                name: 'Front Desk Staff' },
    { username: 'fleet',      password: 'fleet123',  role: 'fleet_control',            name: 'Fleet Controller' },
    { username: 'supervisor', password: 'sup123',    role: 'fleet_control_supervisor', name: 'Fleet Supervisor' },
    { username: 'workshop',   password: 'work123',   role: 'workshop_adviser',         name: 'Workshop Adviser' },
    { username: 'driver',     password: 'drive123',  role: 'driver',                   name: 'Alex Rivera' },
  ];
  for (const u of users) {
    const id = crypto.randomUUID();
    const hash = await hashPassword(u.password);
    await db.request()
      .input('id',   sql.NVarChar, id)
      .input('un',   sql.NVarChar, u.username)
      .input('hash', sql.NVarChar, hash)
      .input('role', sql.NVarChar, u.role)
      .input('name', sql.NVarChar, u.name)
      .query(`MERGE Users AS t USING (SELECT @un AS username) AS s ON t.username = s.username
              WHEN NOT MATCHED THEN INSERT (id, username, passwordHash, role, name) VALUES (@id, @un, @hash, @role, @name);`);
  }
  console.log(`✅ ${users.length} users seeded`);

  const vehicles = [
    { id: 'V-402', name: 'Freight-liner M2 106', plate: 'KF-992-TX', lat: 29.7604, lng: -95.3698, lastInspection: new Date('2026-04-20') },
    { id: 'V-118', name: 'Sprinter Van 419',     plate: 'KF-884-TX', lat: 29.8000, lng: -95.4000, lastInspection: new Date('2026-04-22') },
    { id: 'V-089', name: 'Peterbilt 579',        plate: 'KNC-2938',  lat: 29.7200, lng: -95.3500, lastInspection: new Date('2026-04-24') },
  ];
  for (const v of vehicles) {
    await db.request()
      .input('id',   sql.NVarChar,  v.id)
      .input('name', sql.NVarChar,  v.name)
      .input('plate',sql.NVarChar,  v.plate)
      .input('lat',  sql.Float,     v.lat)
      .input('lng',  sql.Float,     v.lng)
      .input('ins',  sql.DateTime2, v.lastInspection)
      .query(`MERGE Vehicles AS t USING (SELECT @plate AS plate) AS s ON t.plate = s.plate
              WHEN NOT MATCHED THEN INSERT (id, name, plate, status, lat, lng, lastInspection) VALUES (@id, @name, @plate, 'active', @lat, @lng, @ins);`);
  }
  console.log(`✅ ${vehicles.length} vehicles seeded`);

  const bays = [
    { name: 'Bay 01 - Heavy Duty', category: 'heavy_duty', status: 'available' },
    { name: 'Bay 02 - Routine',    category: 'routine',    status: 'available' },
    { name: 'Bay 03 - Quick Ops',  category: 'quick_ops',  status: 'available' },
    { name: 'Bay 04 - Special',    category: 'special',    status: 'maintenance' },
  ];
  for (const b of bays) {
    const id = crypto.randomUUID();
    await db.request()
      .input('id',  sql.NVarChar, id)
      .input('name',sql.NVarChar, b.name)
      .input('cat', sql.NVarChar, b.category)
      .input('st',  sql.NVarChar, b.status)
      .query(`MERGE WorkshopBays AS t USING (SELECT @name AS name) AS s ON t.name = s.name
              WHEN NOT MATCHED THEN INSERT (id, name, category, status) VALUES (@id, @name, @cat, @st);`);
  }
  console.log(`✅ ${bays.length} workshop bays seeded`);

  const reqRow = await db.request().input('u', sql.NVarChar, 'requester').query('SELECT id FROM Users WHERE username = @u');
  const drvRow = await db.request().input('u', sql.NVarChar, 'driver').query('SELECT id FROM Users WHERE username = @u');
  const requesterId = reqRow.recordset[0]?.id;
  const driverId    = drvRow.recordset[0]?.id ?? null;

  if (requesterId) {
    const sampleJobs = [
      { ref: 'KF-1401', type: 'SHUTTLER', status: 'PENDING',  priority: 'HIGH',     vid: 'V-402', driverId: null,     company: 'Atlas Logistics',   location: 'North Cargo Gate, Zone 7', destination: 'Central Distribution Center', workScope: null,                   jobDate: new Date('2026-04-28') },
      { ref: 'KF-1402', type: 'WORKSHOP', status: 'ASSIGNED', priority: 'STANDARD', vid: 'V-118', driverId: driverId, company: 'Internal Fleet',    location: null,                       destination: null,                          workScope: 'Brake noise diagnosis', jobDate: new Date('2026-04-28') },
      { ref: 'KF-1403', type: 'SHUTTLER', status: 'PENDING',  priority: 'CRITICAL', vid: 'V-089', driverId: null,     company: 'Thorne Transports', location: 'East Transit Hub, Pump 4', destination: 'Route 12 standby lot',        workScope: null,                   jobDate: new Date('2026-04-28') },
    ];
    for (const j of sampleJobs) {
      const id = crypto.randomUUID();
      await db.request()
        .input('id',  sql.NVarChar,  id)
        .input('ref', sql.NVarChar,  j.ref)
        .input('type',sql.NVarChar,  j.type)
        .input('st',  sql.NVarChar,  j.status)
        .input('pri', sql.NVarChar,  j.priority)
        .input('vid', sql.NVarChar,  j.vid)
        .input('rid', sql.NVarChar,  requesterId)
        .input('did', sql.NVarChar,  j.driverId)
        .input('co',  sql.NVarChar,  j.company ?? null)
        .input('loc', sql.NVarChar,  j.location ?? null)
        .input('dst', sql.NVarChar,  j.destination ?? null)
        .input('ws',  sql.NVarChar,  j.workScope ?? null)
        .input('jd',  sql.DateTime2, j.jobDate)
        .query(`MERGE Jobs AS t USING (SELECT @ref AS reference) AS s ON t.reference = s.reference
                WHEN NOT MATCHED THEN INSERT (id, reference, type, status, priority, vehicleId, requesterId, driverId, company, location, destination, workScope, jobDate)
                VALUES (@id, @ref, @type, @st, @pri, @vid, @rid, @did, @co, @loc, @dst, @ws, @jd);`);
    }
    console.log('✅ 3 sample jobs seeded');
  }

  console.log('✅ Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); });
