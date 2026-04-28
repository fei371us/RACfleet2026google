import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { generateJobReference } from '../utils/ids.js';

const router = Router();
const vehicleSelect = { vehicle: { select: { name: true, plate: true } } };

function flattenJob(job: any) {
  const { vehicle, ...rest } = job;
  return {
    ...rest,
    // surface reference as id for legacy UI compatibility
    id: rest.reference,
    vehicle_name: vehicle?.name,
    vehicle_plate: vehicle?.plate,
    driver_note: rest.driverNote,
    job_date: rest.jobDate,
    job_scope: rest.workScope,
    vehicle_number_out: rest.vehicleNumberOut,
    vehicle_number_in: rest.vehicleNumberIn,
    job_time: rest.jobTime,
    contact_person: rest.contactPerson,
    contact_number: rest.contactNumber,
    created_at: rest.createdAt,
    checklist: rest.checklist ? (() => { try { return JSON.parse(rest.checklist); } catch { return rest.checklist; } })() : undefined,
  };
}

// GET /api/jobs — role-scoped
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { id, role } = (req as AuthedRequest).user;
  let where: any = {};
  if (role === UserRole.REQUESTER) {
    where = { requesterId: id };
  } else if (role === UserRole.DRIVER) {
    where = { driverId: id, type: 'SHUTTLER' };
  } else if (role === UserRole.WORKSHOP_ADVISER) {
    where = { OR: [{ workshopAdviserId: id }, { type: 'WORKSHOP', workshopAdviserId: null }] };
  }
  const jobs = await prisma.job.findMany({ where, include: vehicleSelect, orderBy: { createdAt: 'desc' } });
  res.json(jobs.map(flattenJob));
});

// GET /api/jobs/:id — resolve by CUID or reference
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const job = await prisma.job.findFirst({
    where: { OR: [{ id: req.params.id }, { reference: req.params.id }] },
    include: { ...vehicleSelect, pins: true },
  });
  if (!job) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(flattenJob(job));
});

const createSchema = z.object({
  type: z.enum(['SHUTTLER', 'WORKSHOP']),
  priority: z.enum(['LOW', 'STANDARD', 'HIGH', 'CRITICAL']).default('STANDARD'),
  vehicleId: z.string().optional(),
  vehicle_id: z.string().optional(),
  company: z.string().optional(),
  contactPerson: z.string().optional(), contact_person: z.string().optional(),
  contactNumber: z.string().optional(), contact_number: z.string().optional(),
  address: z.string().optional(),
  jobDate: z.string().optional(), job_date: z.string().optional(),
  jobTime: z.string().optional(), job_time: z.string().optional(),
  pickupTime: z.string().optional(), pickup_time: z.string().optional(),
  location: z.string().optional(),
  destination: z.string().optional(),
  workScope: z.string().optional(), job_scope: z.string().optional(),
  vehicleNumberOut: z.string().optional(), vehicle_number_out: z.string().optional(),
  instructions: z.string().optional(),
  remarks: z.string().optional(),
});

// POST /api/jobs
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const body = validate(createSchema, req.body, res);
  if (!body) return;
  const { id: requesterId } = (req as AuthedRequest).user;
  const rawDate = body.jobDate ?? body.job_date;
  const job = await prisma.job.create({
    data: {
      reference: generateJobReference(),
      type: body.type,
      priority: body.priority,
      vehicleId: (body.vehicleId ?? body.vehicle_id) as string,
      requesterId,
      company: body.company,
      contactPerson: body.contactPerson ?? body.contact_person,
      contactNumber: body.contactNumber ?? body.contact_number,
      address: body.address,
      jobDate: rawDate ? new Date(rawDate) : undefined,
      jobTime: body.jobTime ?? body.job_time,
      pickupTime: body.pickupTime ?? body.pickup_time,
      location: body.location,
      destination: body.destination,
      workScope: body.workScope ?? body.job_scope,
      vehicleNumberOut: body.vehicleNumberOut ?? body.vehicle_number_out,
      instructions: body.instructions,
      remarks: body.remarks,
    },
  });
  res.status(201).json({ id: job.reference, reference: job.reference });
});

// PATCH /api/jobs/:id — field updates (status, eta, notes)
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { status, eta, driverNote, driver_note, vehicleNumberIn, vehicle_number_in } = req.body;
  await prisma.job.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status: status.toUpperCase() }),
      ...(eta !== undefined && { eta }),
      ...((driverNote ?? driver_note) !== undefined && { driverNote: driverNote ?? driver_note }),
      ...((vehicleNumberIn ?? vehicle_number_in) && { vehicleNumberIn: vehicleNumberIn ?? vehicle_number_in }),
    },
  });
  res.json({ success: true });
});

// POST /api/jobs/:id/assign
router.post('/:id/assign', requireAuth,
  requireRole(UserRole.FLEET_CONTROL_SUPERVISOR, UserRole.FLEET_CONTROL, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { driverId, workshopAdviserId, vehicleId, driver_name } = req.body;
    let resolvedDriverId = driverId;
    if (!resolvedDriverId && driver_name) {
      const u = await prisma.user.findFirst({ where: { name: driver_name, role: UserRole.DRIVER } });
      if (u) resolvedDriverId = u.id;
    }
    await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...(resolvedDriverId && { driverId: resolvedDriverId }),
        ...(workshopAdviserId && { workshopAdviserId }),
        ...(vehicleId && { vehicleId }),
        status: 'ASSIGNED',
      },
    });
    res.json({ success: true });
  }
);

// POST /api/jobs/:id/complete
router.post('/:id/complete', requireAuth,
  requireRole(UserRole.DRIVER, UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { workPerformed, vehicleNumberIn, driverNote, driver_note } = req.body;
    await prisma.job.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        ...(workPerformed && { workPerformed }),
        ...(vehicleNumberIn && { vehicleNumberIn }),
        ...((driverNote ?? driver_note) !== undefined && { driverNote: driverNote ?? driver_note }),
      },
    });
    res.json({ success: true });
  }
);

// PATCH /api/jobs/:id/checklist
router.patch('/:id/checklist', requireAuth,
  requireRole(UserRole.DRIVER, UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    await prisma.job.update({
      where: { id: req.params.id },
      data: { checklist: JSON.stringify(req.body.checklist) },
    });
    res.json({ success: true });
  }
);

export default router;
