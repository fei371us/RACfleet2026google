import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const users = [
    { username: 'admin',      password: 'admin123',  role: 'admin',                    name: 'System Admin' },
    { username: 'requester',  password: 'req123',    role: 'requester',                name: 'Front Desk Staff' },
    { username: 'fleet',      password: 'fleet123',  role: 'fleet_control',            name: 'Fleet Controller' },
    { username: 'supervisor', password: 'sup123',    role: 'fleet_control_supervisor', name: 'Fleet Supervisor' },
    { username: 'workshop',   password: 'work123',   role: 'workshop_adviser',         name: 'Workshop Adviser' },
    { username: 'driver',     password: 'drive123',  role: 'driver',                   name: 'Alex Rivera' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, passwordHash: await hashPassword(u.password), role: u.role, name: u.name },
    });
  }
  console.log(`✅ ${users.length} users seeded`);

  const vehicles = [
    { id: 'V-402', name: 'Freight-liner M2 106', plate: 'KF-992-TX', status: 'active', lat: 29.7604, lng: -95.3698, lastInspection: new Date('2026-04-20') },
    { id: 'V-118', name: 'Sprinter Van 419',     plate: 'KF-884-TX', status: 'active', lat: 29.8000, lng: -95.4000, lastInspection: new Date('2026-04-22') },
    { id: 'V-089', name: 'Peterbilt 579',        plate: 'KNC-2938',  status: 'active', lat: 29.7200, lng: -95.3500, lastInspection: new Date('2026-04-24') },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { plate: v.plate }, update: {}, create: v });
  }
  console.log(`✅ ${vehicles.length} vehicles seeded`);

  const bays = [
    { name: 'Bay 01 - Heavy Duty', category: 'heavy_duty', status: 'available' },
    { name: 'Bay 02 - Routine',    category: 'routine',    status: 'available' },
    { name: 'Bay 03 - Quick Ops',  category: 'quick_ops',  status: 'available' },
    { name: 'Bay 04 - Special',    category: 'special',    status: 'maintenance' },
  ];
  for (const b of bays) {
    await prisma.workshopBay.upsert({ where: { name: b.name }, update: {}, create: b });
  }
  console.log(`✅ ${bays.length} workshop bays seeded`);

  const requesterUser = await prisma.user.findUnique({ where: { username: 'requester' } });
  const driverUser    = await prisma.user.findUnique({ where: { username: 'driver' } });
  const v402 = await prisma.vehicle.findUnique({ where: { plate: 'KF-992-TX' } });
  const v118 = await prisma.vehicle.findUnique({ where: { plate: 'KF-884-TX' } });
  const v089 = await prisma.vehicle.findUnique({ where: { plate: 'KNC-2938' } });

  if (requesterUser && v402 && v118 && v089) {
    const sampleJobs = [
      { reference: 'KF-1401', type: 'SHUTTLER', status: 'PENDING',  priority: 'HIGH',     vehicleId: v402.id, location: 'North Cargo Gate, Zone 7',  destination: 'Central Distribution Center', company: 'Atlas Logistics',   jobDate: new Date('2026-04-28') },
      { reference: 'KF-1402', type: 'WORKSHOP', status: 'ASSIGNED', priority: 'STANDARD', vehicleId: v118.id, workScope: 'Brake noise diagnosis',     company: 'Internal Fleet',    driverId: driverUser?.id, jobDate: new Date('2026-04-28') },
      { reference: 'KF-1403', type: 'SHUTTLER', status: 'PENDING',  priority: 'CRITICAL', vehicleId: v089.id, location: 'East Transit Hub, Pump 4',   destination: 'Route 12 standby lot',        company: 'Thorne Transports', jobDate: new Date('2026-04-28') },
    ];
    for (const j of sampleJobs) {
      await prisma.job.upsert({ where: { reference: j.reference }, update: {}, create: { ...j, requesterId: requesterUser.id } });
    }
    console.log(`✅ 3 sample jobs seeded`);
  }

  console.log('✅ Seed complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
