import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { Server } from 'socket.io';
import { createServer } from 'http';

const db = new Database('fleet.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    driver_name TEXT,
    location TEXT,
    pickup_time TEXT,
    destination TEXT,
    instructions TEXT,
    eta TEXT,
    driver_note TEXT,
    job_date TEXT,
    job_scope TEXT,
    vehicle_number_out TEXT,
    vehicle_number_in TEXT,
    job_time TEXT,
    company TEXT,
    requester TEXT,
    contact_person TEXT,
    contact_number TEXT,
    address TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plate TEXT NOT NULL,
    last_inspection TEXT,
    status TEXT NOT NULL,
    lat REAL DEFAULT 0,
    lng REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inspection_pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT,
    vehicle_id TEXT,
    x REAL,
    y REAL,
    type TEXT,
    note TEXT,
    photo_url TEXT
  );
`);

// Migrations
const migrations = [
  'ALTER TABLE jobs ADD COLUMN driver_note TEXT',
  'ALTER TABLE jobs ADD COLUMN job_date TEXT',
  'ALTER TABLE jobs ADD COLUMN job_scope TEXT',
  'ALTER TABLE jobs ADD COLUMN vehicle_number_out TEXT',
  'ALTER TABLE jobs ADD COLUMN vehicle_number_in TEXT',
  'ALTER TABLE jobs ADD COLUMN job_time TEXT',
  'ALTER TABLE jobs ADD COLUMN company TEXT',
  'ALTER TABLE jobs ADD COLUMN requester TEXT',
  'ALTER TABLE jobs ADD COLUMN contact_person TEXT',
  'ALTER TABLE jobs ADD COLUMN contact_number TEXT',
  'ALTER TABLE jobs ADD COLUMN address TEXT',
  'ALTER TABLE jobs ADD COLUMN remarks TEXT'
];

migrations.forEach(m => {
  try {
    db.exec(m);
  } catch (e) {
    // Column likely already exists
  }
});

// Seed data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('U-1', 'admin', 'admin123', 'admin', 'System Admin');
  insertUser.run('U-2', 'requester', 'req123', 'requester', 'Front Desk Staff');
  insertUser.run('U-3', 'fleet', 'fleet123', 'fleet_control', 'Fleet Controller');
  insertUser.run('U-4', 'supervisor', 'sup123', 'fleet_control_supervisor', 'Fleet Supervisor');
  insertUser.run('U-5', 'workshop', 'work123', 'workshop_adviser', 'Workshop Adviser');
  insertUser.run('U-6', 'driver', 'drive123', 'driver', 'Alex Rivera');
}

const jobCount = db.prepare('SELECT count(*) as count FROM jobs').get() as any;
if (jobCount.count === 0) {
  const insertVehicle = db.prepare('INSERT INTO vehicles (id, name, plate, last_inspection, status, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertVehicle.run('V-402', 'Freight-liner M2 106', 'KF-992-TX', '2026-04-20', 'active', 29.7604, -95.3698);
  insertVehicle.run('V-118', 'Sprinter Van 419', 'KF-884-TX', '2026-04-22', 'active', 29.8000, -95.4000);
  insertVehicle.run('V-089', 'Peterbilt 579', 'KNC-2938', '2026-04-24', 'active', 29.7200, -95.3500);

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, type, status, priority, vehicle_id, driver_name, location, pickup_time, destination, eta, driver_note,
      job_date, job_scope, vehicle_number_out, vehicle_number_in, job_time, company, requester, contact_person, contact_number, address, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertJob.run(
    'KF-9921', 'Delivery', 'in_transit', 'high', 'V-402', 'Alex Rivera', 'Terminal A, Port of Houston', '09:30 AM', 'Downtown Hub', '14:30 PM', 'Heavy traffic on I-45',
    '2026-04-25', 'Logistics Delivery', 'KF-992-TX', null, '09:30 AM', 'Global Logistics Inc', 'John Requester', 'John Smith', '555-0123', 'Port of Houston', 'Handle with care'
  );
  
  insertJob.run(
    'KF-8840', 'Workshop', 'pending', 'standard', 'V-118', 'Sarah Chen', 'Northwest Distribution Hub', '11:45 AM', 'Main Workshop', '15:15 PM', null,
    '2026-04-25', 'Engine Maintenance', 'KF-884-TX', null, '11:45 AM', 'Internal Fleet', 'Fleet Requester', 'Sarah Chen', '555-0124', 'Northwest Hub', 'Routine checkup'
  );
  
  insertJob.run(
    'KF-7732', 'Refill', 'delayed', 'critical', 'V-089', 'Marcus Thorne', 'East Dock, Loading Zone 4', '02:15 PM', 'Station 12', 'Pump Issue', 'Waiting for pump repair',
    '2026-04-25', 'Fuel Refill', 'KNC-2938', null, '02:15 PM', 'Thorne Transports', 'Marcus Requester', 'Marcus Thorne', '555-0125', 'East Dock', 'Urgent'
  );
}

// Ensure sample vehicles and driver-assigned jobs always exist (idempotent seed)
const ensureVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles (id, name, plate, last_inspection, status, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

ensureVehicle.run('V-402', 'Freight-liner M2 106', 'KF-992-TX', '2026-04-20', 'active', 29.7604, -95.3698);
ensureVehicle.run('V-118', 'Sprinter Van 419', 'KF-884-TX', '2026-04-22', 'active', 29.8000, -95.4000);
ensureVehicle.run('V-089', 'Peterbilt 579', 'KNC-2938', '2026-04-24', 'active', 29.7200, -95.3500);

const ensureJob = db.prepare(`
  INSERT OR IGNORE INTO jobs (
    id, type, status, priority, vehicle_id, driver_name, location, pickup_time, destination, instructions, eta, driver_note,
    job_date, job_scope, vehicle_number_out, vehicle_number_in, job_time, company, requester, contact_person, contact_number, address, remarks
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

ensureJob.run(
  'KF-1401', 'Delivery', 'pending', 'high', 'V-402', 'Alex Rivera',
  'North Cargo Gate, Zone 7', '08:45 AM', 'Central Distribution Center', 'Deliver sealed cargo; verify pallet count at drop-off.',
  '10:05 AM', 'Ready for pickup at Gate 3',
  '2026-04-26', 'Morning cargo delivery with chain-of-custody handoff.', 'KF-992-TX', null, '08:45 AM',
  'Atlas Logistics', 'Ops Desk', 'Maya Chen', '555-0180', '17 Harbor Drive', 'Carry barcode scanner for receiving confirmation.'
);

ensureJob.run(
  'KF-1402', 'Workshop', 'in_transit', 'standard', 'V-118', 'Alex Rivera',
  'Fleet Yard B', '11:15 AM', 'Main Workshop Bay 2', 'Bring vehicle for brake noise diagnosis.',
  '11:50 AM', 'On route, traffic moderate',
  '2026-04-26', 'Workshop diagnostic and preventive maintenance intake.', 'KF-884-TX', null, '11:15 AM',
  'Internal Fleet', 'Fleet Control', 'Ravi Kumar', '555-0181', '2 Service Lane', 'Provide latest driver feedback to adviser.'
);

ensureJob.run(
  'KF-1403', 'Refill', 'pending', 'critical', 'V-089', 'Alex Rivera',
  'East Transit Hub, Pump 4', '02:30 PM', 'Route 12 standby lot', 'Emergency refill and pressure check before night shift.',
  '03:10 PM', '',
  '2026-04-26', 'Priority fuel refill and safety pressure check.', 'KNC-2938', null, '02:30 PM',
  'Thorne Transports', 'Night Ops', 'Lena Park', '555-0182', '88 Transit Road', 'Dispatch requested immediate completion.'
);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Simulation: Move vehicles slightly every 3 seconds
  setInterval(() => {
    const vehicles = db.prepare('SELECT id, lat, lng FROM vehicles').all() as any[];
    vehicles.forEach(v => {
      // Small random movement
      const newLat = v.lat + (Math.random() - 0.5) * 0.001;
      const newLng = v.lng + (Math.random() - 0.5) * 0.001;
      db.prepare('UPDATE vehicles SET lat = ?, lng = ? WHERE id = ?').run(newLat, newLng, v.id);
    });
    
    const updatedVehicles = db.prepare('SELECT * FROM vehicles').all();
    io.emit('fleet:telemetry', updatedVehicles);
  }, 3000);

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT id, username, role, name, created_at FROM users').all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { id, username, password, role, name } = req.body;
    try {
      const insert = db.prepare('INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)');
      insert.run(id, username, password, role, name);
      res.status(201).json({ id });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists or invalid data' });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/jobs', (req, res) => {
    const jobs = db.prepare('SELECT j.*, v.name as vehicle_name, v.plate as vehicle_plate FROM jobs j JOIN vehicles v ON j.vehicle_id = v.id ORDER BY j.created_at DESC').all();
    res.json(jobs);
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = db.prepare('SELECT j.*, v.name as vehicle_name, v.plate as vehicle_plate FROM jobs j JOIN vehicles v ON j.vehicle_id = v.id WHERE j.id = ?').get(req.params.id);
    const pins = db.prepare('SELECT * FROM inspection_pins WHERE job_id = ?').all(req.params.id);
    res.json({ ...job as any, pins });
  });

  app.post('/api/jobs', (req, res) => {
    const { 
      id, type, priority, vehicle_id, location, pickup_time, destination, instructions,
      job_date, job_scope, vehicle_number_out, vehicle_number_in, job_time, company, requester, contact_person, contact_number, address, remarks
    } = req.body;
    
    const insert = db.prepare(`
      INSERT INTO jobs (
        id, type, status, priority, vehicle_id, location, pickup_time, destination, instructions,
        job_date, job_scope, vehicle_number_out, vehicle_number_in, job_time, company, requester, contact_person, contact_number, address, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(
      id, type, 'pending', priority, vehicle_id, location, pickup_time, destination, instructions,
      job_date, job_scope, vehicle_number_out, vehicle_number_in, job_time, company, requester, contact_person, contact_number, address, remarks
    );
    res.status(201).json({ id });
  });

  app.patch('/api/jobs/:id', (req, res) => {
    const { status, eta, driver_note, driver_name } = req.body;
    if (status) db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, req.params.id);
    if (eta) db.prepare('UPDATE jobs SET eta = ? WHERE id = ?').run(eta, req.params.id);
    if (driver_note !== undefined) db.prepare('UPDATE jobs SET driver_note = ? WHERE id = ?').run(driver_note, req.params.id);
    if (driver_name) db.prepare('UPDATE jobs SET driver_name = ? WHERE id = ?').run(driver_name, req.params.id);
    res.json({ success: true });
  });

  app.post('/api/jobs/:id/assign', (req, res) => {
    const { driver_name } = req.body;
    db.prepare('UPDATE jobs SET driver_name = ? WHERE id = ?').run(driver_name, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/vehicles', (req, res) => {
    const vehicles = db.prepare('SELECT * FROM vehicles').all();
    res.json(vehicles);
  });

  app.post('/api/inspection/pins', (req, res) => {
    const { job_id, vehicle_id, x, y, type, note, photo_url } = req.body;
    const insert = db.prepare('INSERT INTO inspection_pins (job_id, vehicle_id, x, y, type, note, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = insert.run(job_id, vehicle_id, x, y, type, note, photo_url);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.patch('/api/inspection/pins/:id', (req, res) => {
    const { type, note, photo_url } = req.body;
    const existing = db.prepare('SELECT id FROM inspection_pins WHERE id = ?').get(req.params.id) as { id: number } | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Pin not found' });
      return;
    }

    if (type !== undefined) {
      db.prepare('UPDATE inspection_pins SET type = ? WHERE id = ?').run(type, req.params.id);
    }
    if (note !== undefined) {
      db.prepare('UPDATE inspection_pins SET note = ? WHERE id = ?').run(note, req.params.id);
    }
    if (photo_url !== undefined) {
      db.prepare('UPDATE inspection_pins SET photo_url = ? WHERE id = ?').run(photo_url, req.params.id);
    }

    const updated = db.prepare('SELECT * FROM inspection_pins WHERE id = ?').get(req.params.id);
    res.json(updated);
  });

  app.delete('/api/inspection/pins/:id', (req, res) => {
    const result = db.prepare('DELETE FROM inspection_pins WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Pin not found' });
      return;
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
