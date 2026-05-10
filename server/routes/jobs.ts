import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb, sql } from '../db/sql.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
let ensureDriverMetricsColumnsPromise: Promise<void> | null = null;

async function ensureDriverMetricsColumns(db: sql.ConnectionPool) {
  if (!ensureDriverMetricsColumnsPromise) {
    ensureDriverMetricsColumnsPromise = db.request().query(`
      IF COL_LENGTH('Jobs', 'petrolOut') IS NULL
        ALTER TABLE Jobs ADD petrolOut NVARCHAR(100) NULL;
      IF COL_LENGTH('Jobs', 'petrolIn') IS NULL
        ALTER TABLE Jobs ADD petrolIn NVARCHAR(100) NULL;
      IF COL_LENGTH('Jobs', 'mileageOut') IS NULL
        ALTER TABLE Jobs ADD mileageOut NVARCHAR(100) NULL;
      IF COL_LENGTH('Jobs', 'mileageIn') IS NULL
        ALTER TABLE Jobs ADD mileageIn NVARCHAR(100) NULL;
    `).then(() => undefined).catch((e) => {
      ensureDriverMetricsColumnsPromise = null;
      throw e;
    });
  }
  await ensureDriverMetricsColumnsPromise;
}

const JOB_SELECT = `
  SELECT
    j.*,
    v.name AS vehicle_name,
    v.plate AS vehicle_plate,
    d.name AS driver_name,
    d.username AS driver_username,
    r.name AS requester_name,
    r.username AS requester_username,
    wa.name AS workshop_adviser_name,
    wa.username AS workshop_adviser_username
  FROM Jobs j
  LEFT JOIN Vehicles v ON v.id = j.vehicleId
  LEFT JOIN Users d ON d.id = j.driverId
  LEFT JOIN Users r ON r.id = j.requesterId
  LEFT JOIN Users wa ON wa.id = j.workshopAdviserId
`;

async function ensureJobReferenceSequence(db: sql.ConnectionPool) {
  await db.request().query(`
    IF OBJECT_ID('dbo.JobReferenceSeq', 'SO') IS NULL
    BEGIN
      DECLARE @start BIGINT =
        ISNULL((
          SELECT MAX(TRY_CAST(SUBSTRING(reference, 4, 32) AS BIGINT))
          FROM Jobs
          WHERE reference LIKE 'RA-[0-9]%'
        ), 0) + 1;
      DECLARE @sql NVARCHAR(400) =
        N'CREATE SEQUENCE dbo.JobReferenceSeq AS BIGINT START WITH ' + CAST(@start AS NVARCHAR(30)) + N' INCREMENT BY 1';
      EXEC(@sql);
    END
  `);
}

async function getNextJobReferenceAndCreatedAt(db: sql.ConnectionPool) {
  await ensureJobReferenceSequence(db);
  const result = await db.request().query(`
    SELECT
      CONCAT('RA-', RIGHT(REPLICATE('0', 6) + CAST(NEXT VALUE FOR dbo.JobReferenceSeq AS VARCHAR(20)), 6)) AS reference,
      SYSUTCDATETIME() AS createdAt
  `);
  return result.recordset[0] as { reference: string; createdAt: string };
}

function flattenRow(row: any, pins?: any[]) {
  return {
    ...row,
    job_db_id:           row.id,
    id:                  row.reference,
    vehicle_name:        row.vehicle_name,
    vehicle_plate:       row.vehicle_plate,
    driver_name:         row.driver_name,
    driver_username:     row.driver_username,
    requester_name:      row.requester_name,
    requester_username:  row.requester_username,
    workshop_adviser_name: row.workshop_adviser_name,
    workshop_adviser_username: row.workshop_adviser_username,
    pins,
    driver_note:         row.driverNote,
    job_date:            row.jobDate,
    job_scope:           row.workScope,
    shuttler_sub_type:   row.shuttlerSubType,
    vehicle_number_out:  row.vehicleNumberOut,
    vehicle_number_in:   row.vehicleNumberIn,
    petrol_out:          row.petrolOut,
    petrol_in:           row.petrolIn,
    mileage_out:         row.mileageOut,
    mileage_in:          row.mileageIn,
    job_time:            row.jobTime,
    contact_person:      row.contactPerson,
    contact_number:      row.contactNumber,
    created_at:          row.createdAt,
    checklist: row.checklist
      ? (() => { try { return JSON.parse(row.checklist); } catch { return row.checklist; } })()
      : undefined,
  };
}

// GET /api/jobs — role-scoped list with optional filtering
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { id, role } = (req as AuthedRequest).user;
  const { shuttlerSubType } = req.query;
  const db = await getDb();
  const request = db.request();
  let where = '';

  if (role === UserRole.REQUESTER) {
    where = 'WHERE j.requesterId = @uid';
    request.input('uid', sql.NVarChar, id);
  } else if (role === UserRole.DRIVER) {
    where = "WHERE j.driverId = @uid AND j.type = 'SHUTTLER'";
    request.input('uid', sql.NVarChar, id);
  } else if (role === UserRole.WORKSHOP_ADVISER) {
    where = "WHERE (j.workshopAdviserId = @uid OR (j.type = 'WORKSHOP' AND j.workshopAdviserId IS NULL))";
    request.input('uid', sql.NVarChar, id);
  }

  // Apply optional shuttlerSubType filter
  if (shuttlerSubType && typeof shuttlerSubType === 'string') {
    const and = where ? ' AND' : ' WHERE';
    where += `${and} j.shuttlerSubType = @sst`;
    request.input('sst', sql.NVarChar, shuttlerSubType);
  }

  const result = await request.query(`${JOB_SELECT} ${where} ORDER BY j.createdAt DESC`);
  res.json(result.recordset.map(r => flattenRow(r)));
});

// GET /api/jobs/:id — resolve by reference or id
router.get('/new/meta', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDb();
  const meta = await getNextJobReferenceAndCreatedAt(db);
  res.json(meta);
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const db = await getDb();
  const jobResult = await db.request()
    .input('ref', sql.NVarChar, req.params.id)
    .query(`${JOB_SELECT} WHERE j.id = @ref OR j.reference = @ref`);

  const row = jobResult.recordset[0];
  if (!row) { res.status(404).json({ error: 'Not found' }); return; }

  const pinsResult = await db.request()
    .input('jobId', sql.NVarChar, row.id)
    .query('SELECT * FROM InspectionPins WHERE jobId = @jobId');

  res.json(flattenRow(row, pinsResult.recordset));
});

const createSchema = z.object({
  reference:        z.string().optional(),
  createdAt:        z.string().optional(),
  type:             z.enum(['SHUTTLER', 'WORKSHOP']),
  shuttlerSubType:  z.string().optional(),
  priority:         z.enum(['LOW', 'STANDARD', 'HIGH', 'CRITICAL']).default('STANDARD'),
  vehicleId:        z.string().optional(), vehicle_id:        z.string().optional(),
  company:          z.string().optional(),
  contactPerson:    z.string().optional(), contact_person:    z.string().optional(),
  contactNumber:    z.string().optional(), contact_number:    z.string().optional(),
  address:          z.string().optional(),
  jobDate:          z.string().optional(), job_date:          z.string().optional(),
  jobTime:          z.string().optional(), job_time:          z.string().optional(),
  pickupTime:       z.string().optional(), pickup_time:       z.string().optional(),
  location:         z.string().optional(),
  destination:      z.string().optional(),
  workScope:        z.string().optional(), job_scope:         z.string().optional(),
  vehicleNumberOut: z.string().optional(), vehicle_number_out:z.string().optional(),
  vehicleNumberIn:  z.string().optional(), vehicle_number_in: z.string().optional(),
  instructions:     z.string().optional(),
  remarks:          z.string().optional(),
});

// POST /api/jobs
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = validate(createSchema, req.body, res);
    if (!body) return;
    const { id: requesterId } = (req as AuthedRequest).user;
    const jobId = crypto.randomUUID();
    const parsedCreatedAt = body.createdAt ? new Date(body.createdAt) : new Date();
    const createdAt = Number.isNaN(parsedCreatedAt.getTime()) ? new Date() : parsedCreatedAt;
    const rawDate  = body.jobDate ?? body.job_date;
    console.log('[POST /api/jobs] Creating job:', { jobId, requesterId, company: body.company, type: body.type });
    const db = await getDb();
    console.log('[POST /api/jobs] Database connected');
    const generated = body.reference
      ? { reference: body.reference, createdAt: createdAt.toISOString() }
      : await getNextJobReferenceAndCreatedAt(db);
    const reference = generated.reference;
    const effectiveCreatedAt = body.createdAt ? createdAt : new Date(generated.createdAt);

    const insertResult = await db.request()
      .input('id',   sql.NVarChar,  jobId)
      .input('ref',  sql.NVarChar,  reference)
      .input('type', sql.NVarChar,  body.type)
      .input('sst',  sql.NVarChar,  body.shuttlerSubType ?? null)
      .input('pri',  sql.NVarChar,  body.priority)
      .input('vid',  sql.NVarChar,  body.vehicleId ?? body.vehicle_id ?? null)
      .input('rid',  sql.NVarChar,  requesterId)
      .input('co',   sql.NVarChar,  body.company ?? null)
      .input('cp',   sql.NVarChar,  body.contactPerson ?? body.contact_person ?? null)
      .input('cn',   sql.NVarChar,  body.contactNumber ?? body.contact_number ?? null)
      .input('addr', sql.NVarChar,  body.address ?? null)
      .input('jd',   sql.DateTime2, rawDate ? new Date(rawDate) : null)
      .input('jt',   sql.NVarChar,  body.jobTime ?? body.job_time ?? null)
      .input('pt',   sql.NVarChar,  body.pickupTime ?? body.pickup_time ?? null)
      .input('loc',  sql.NVarChar,  body.location ?? null)
      .input('dst',  sql.NVarChar,  body.destination ?? null)
      .input('ws',   sql.NVarChar,  body.workScope ?? body.job_scope ?? null)
      .input('vno',  sql.NVarChar,  body.vehicleNumberOut ?? body.vehicle_number_out ?? null)
      .input('vni',  sql.NVarChar,  body.vehicleNumberIn ?? body.vehicle_number_in ?? null)
      .input('cat',  sql.DateTime2, effectiveCreatedAt)
      .input('inst', sql.NVarChar,  body.instructions ?? null)
      .input('rmk',  sql.NVarChar,  body.remarks ?? null)
      .query(`INSERT INTO Jobs
        (id, reference, type, shuttlerSubType, status, priority, vehicleId, requesterId, company, contactPerson, contactNumber,
         address, jobDate, jobTime, pickupTime, location, destination, workScope, vehicleNumberOut, vehicleNumberIn, createdAt, instructions, remarks)
        OUTPUT INSERTED.reference AS reference, INSERTED.createdAt AS createdAt
        VALUES (@id, @ref, @type, @sst, 'PENDING', @pri, @vid, @rid, @co, @cp, @cn,
                @addr, @jd, @jt, @pt, @loc, @dst, @ws, @vno, @vni, @cat, @inst, @rmk)`);

    const created = insertResult.recordset[0];
    console.log('[POST /api/jobs] Job created successfully:', { reference: created.reference, createdAt: created.createdAt });
    res.status(201).json({ id: created.reference, reference: created.reference, createdAt: created.createdAt });
  } catch (error) {
    console.error('[POST /api/jobs] Error creating job:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create job' });
  }
});

// PATCH /api/jobs/:id
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { status, eta, driverNote, driver_note, vehicleNumberIn, vehicle_number_in, petrol_out, petrol_in, mileage_out, mileage_in } = req.body;
  const db = await getDb();
  await ensureDriverMetricsColumns(db);
  const updates: string[] = [];
  const request = db.request().input('ref', sql.NVarChar, req.params.id);
  if (status)                { updates.push('status = @status');        request.input('status', sql.NVarChar, status.toUpperCase()); }
  if (eta !== undefined)     { updates.push('eta = @eta');              request.input('eta',    sql.NVarChar, eta); }
  const note = driverNote ?? driver_note;
  if (note !== undefined)    { updates.push('driverNote = @dn');        request.input('dn',     sql.NVarChar, note); }
  const vin = vehicleNumberIn ?? vehicle_number_in;
  if (vin)                   { updates.push('vehicleNumberIn = @vin');  request.input('vin',    sql.NVarChar, vin); }
  if (petrol_out !== undefined)  { updates.push('petrolOut = @pout');   request.input('pout',   sql.NVarChar, petrol_out); }
  if (petrol_in !== undefined)   { updates.push('petrolIn = @pin');     request.input('pin',    sql.NVarChar, petrol_in); }
  if (mileage_out !== undefined) { updates.push('mileageOut = @mout');  request.input('mout',   sql.NVarChar, mileage_out); }
  if (mileage_in !== undefined)  { updates.push('mileageIn = @min');    request.input('min',    sql.NVarChar, mileage_in); }
  if (updates.length > 0)
    await request.query(`UPDATE Jobs SET ${updates.join(', ')} WHERE id = @ref OR reference = @ref`);
  res.json({ success: true });
});

// POST /api/jobs/:id/assign
router.post('/:id/assign', requireAuth,
  requireRole(UserRole.FLEET_CONTROL_SUPERVISOR, UserRole.FLEET_CONTROL, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { driverId, workshopAdviserId, vehicleId, driver_name } = req.body;
    const db = await getDb();
    let resolvedDriverId = driverId;
    if (!resolvedDriverId && driver_name) {
      const r = await db.request()
        .input('nm',   sql.NVarChar, driver_name)
        .input('role', sql.NVarChar, UserRole.DRIVER)
        .query('SELECT id FROM Users WHERE name = @nm AND role = @role');
      if (r.recordset[0]) resolvedDriverId = r.recordset[0].id;
    }
    const updates: string[] = [];
    const request = db.request().input('ref', sql.NVarChar, req.params.id);
    const current = await db.request()
      .input('ref', sql.NVarChar, req.params.id)
      .query('SELECT status FROM Jobs WHERE id = @ref OR reference = @ref');
    const currentStatus = current.recordset[0]?.status as string | undefined;
    if (!currentStatus) { res.status(404).json({ error: 'Not found' }); return; }
    if (currentStatus === 'PENDING') updates.push("status = 'ASSIGNED'");
    if (resolvedDriverId)  { updates.push('driverId = @did');           request.input('did',  sql.NVarChar, resolvedDriverId); }
    if (workshopAdviserId) { updates.push('workshopAdviserId = @waid'); request.input('waid', sql.NVarChar, workshopAdviserId); }
    if (vehicleId)         { updates.push('vehicleId = @vid');          request.input('vid',  sql.NVarChar, vehicleId); }
    if (updates.length === 0) { res.status(400).json({ error: 'No assignment fields provided' }); return; }
    await request.query(`UPDATE Jobs SET ${updates.join(', ')} WHERE id = @ref OR reference = @ref`);
    res.json({ success: true });
  }
);

// POST /api/jobs/:id/complete
router.post('/:id/complete', requireAuth,
  requireRole(UserRole.DRIVER, UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { workPerformed, vehicleNumberIn, driverNote, driver_note, petrol_out, petrol_in, mileage_out, mileage_in } = req.body;
    const db = await getDb();
    await ensureDriverMetricsColumns(db);
    const updates: string[] = ["status = 'COMPLETED'"];
    const request = db.request().input('ref', sql.NVarChar, req.params.id);
    if (workPerformed)          { updates.push('workPerformed = @wp');    request.input('wp',  sql.NVarChar, workPerformed); }
    if (vehicleNumberIn)        { updates.push('vehicleNumberIn = @vin'); request.input('vin', sql.NVarChar, vehicleNumberIn); }
    if (petrol_out !== undefined)  { updates.push('petrolOut = @pout');   request.input('pout', sql.NVarChar, petrol_out); }
    if (petrol_in !== undefined)   { updates.push('petrolIn = @pin');     request.input('pin',  sql.NVarChar, petrol_in); }
    if (mileage_out !== undefined) { updates.push('mileageOut = @mout');  request.input('mout', sql.NVarChar, mileage_out); }
    if (mileage_in !== undefined)  { updates.push('mileageIn = @min');    request.input('min',  sql.NVarChar, mileage_in); }
    const note = driverNote ?? driver_note;
    if (note !== undefined)     { updates.push('driverNote = @dn');       request.input('dn',  sql.NVarChar, note); }
    await request.query(`UPDATE Jobs SET ${updates.join(', ')} WHERE id = @ref OR reference = @ref`);
    res.json({ success: true });
  }
);

// PATCH /api/jobs/:id/checklist
router.patch('/:id/checklist', requireAuth,
  requireRole(UserRole.DRIVER, UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const db = await getDb();
    await db.request()
      .input('cl',  sql.NVarChar, JSON.stringify(req.body.checklist))
      .input('ref', sql.NVarChar, req.params.id)
      .query('UPDATE Jobs SET checklist = @cl WHERE id = @ref OR reference = @ref');
    res.json({ success: true });
  }
);

export default router;
