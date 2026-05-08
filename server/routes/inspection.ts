import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb, sql } from '../db/sql.js';
import { AuthedRequest, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createPinPhotoReadUrl,
  createPinPhotoUploadUrl,
  deletePinPhoto,
  isBlobStorageConfigured,
} from '../lib/blobStorage.js';

const router = Router();

const pinSchema = z.object({
  job_id: z.string().optional(),    jobId: z.string().optional(),
  vehicle_id: z.string().optional(), vehicleId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  type: z.string(),
  note: z.string().optional(),
  photo_url: z.string().optional(), photoUrl: z.string().optional(),
});
const photoUploadSchema = z.object({
  fileName: z.string().min(1).max(240),
});
const photoFinalizeSchema = z.object({
  blobPath: z.string().min(1),
});
const photoUrlsSchema = z.object({
  pinIds: z.array(z.number().int().positive()).max(200).default([]),
});
const exteriorCheckSchema = z.object({
  checkedBy: z.string().min(1),
  checkedSignature: z.string().min(1),
  receivedBy: z.string().min(1),
  receivedSignature: z.string().min(1),
  gps: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }),
});

router.post('/pins', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = validate(pinSchema, req.body, res);
    if (!body) return;
    const db = await getDb();

    // Accept either internal Jobs.id (UUID) or human-facing Jobs.reference (RA-xxxxxx).
    const incomingJobRef = body.jobId ?? body.job_id ?? null;
    let resolvedJobId = incomingJobRef;
    if (incomingJobRef) {
      const jobLookup = await db.request()
        .input('ref', sql.NVarChar, incomingJobRef)
        .query('SELECT TOP 1 id FROM Jobs WHERE id = @ref OR reference = @ref');
      resolvedJobId = jobLookup.recordset[0]?.id ?? null;
      if (!resolvedJobId) {
        res.status(400).json({ error: `Invalid job_id: ${incomingJobRef}` });
        return;
      }
    }

    const result = await db.request()
      .input('jobId',     sql.NVarChar, resolvedJobId)
      .input('vehicleId', sql.NVarChar, body.vehicleId ?? body.vehicle_id ?? null)
      .input('x',         sql.Float,    body.x)
      .input('y',         sql.Float,    body.y)
      .input('type',      sql.NVarChar, body.type.toUpperCase())
      .input('note',      sql.NVarChar, body.note ?? null)
      .input('photoUrl',  sql.NVarChar, body.photoUrl ?? body.photo_url ?? null)
      .query('INSERT INTO InspectionPins (jobId, vehicleId, x, y, type, note, photoUrl) OUTPUT INSERTED.id VALUES (@jobId, @vehicleId, @x, @y, @type, @note, @photoUrl)');
    res.status(201).json({ id: result.recordset[0].id });
  } catch (error) {
    console.error('[POST /api/inspection/pins] Failed to create pin:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create pin' });
  }
});

router.patch('/pins/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const db = await getDb();
  const existing = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM InspectionPins WHERE id = @id');
  if (!existing.recordset[0]) { res.status(404).json({ error: 'Pin not found' }); return; }

  const { type, note, photo_url, photoUrl } = req.body;
  const updates: string[] = [];
  const request = db.request().input('id', sql.Int, id);
  if (type !== undefined)     { updates.push('type = @type');   request.input('type',    sql.NVarChar, type.toUpperCase()); }
  if (note !== undefined)     { updates.push('note = @note');   request.input('note',    sql.NVarChar, note); }
  const pv = photoUrl ?? photo_url;
  if (pv !== undefined)       { updates.push('photoUrl = @pv'); request.input('pv',      sql.NVarChar, pv); }
  if (updates.length > 0)
    await request.query(`UPDATE InspectionPins SET ${updates.join(', ')} WHERE id = @id`);

  const updated = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM InspectionPins WHERE id = @id');
  res.json(updated.recordset[0]);
});

router.post('/pins/:id/photo-upload-url', requireAuth, async (req: Request, res: Response) => {
  if (!isBlobStorageConfigured()) {
    res.status(503).json({ error: 'Blob storage is not configured on the server.' });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid pin id' });
    return;
  }
  const body = validate(photoUploadSchema, req.body, res);
  if (!body) return;

  const db = await getDb();
  const existing = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT id FROM InspectionPins WHERE id = @id');
  if (!existing.recordset[0]) {
    res.status(404).json({ error: 'Pin not found' });
    return;
  }

  const upload = await createPinPhotoUploadUrl(id, body.fileName);
  res.json(upload);
});

router.post('/pins/:id/photo-finalize', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid pin id' });
    return;
  }
  const body = validate(photoFinalizeSchema, req.body, res);
  if (!body) return;

  const db = await getDb();
  const existing = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT photoUrl FROM InspectionPins WHERE id = @id');
  if (!existing.recordset[0]) {
    res.status(404).json({ error: 'Pin not found' });
    return;
  }

  const previousPhoto = existing.recordset[0].photoUrl as string | null;
  await db.request()
    .input('id', sql.Int, id)
    .input('photoUrl', sql.NVarChar, body.blobPath)
    .query('UPDATE InspectionPins SET photoUrl = @photoUrl WHERE id = @id');

  if (previousPhoto && previousPhoto !== body.blobPath && isBlobStorageConfigured()) {
    await deletePinPhoto(previousPhoto).catch(() => {});
  }

  const photoViewUrl = isBlobStorageConfigured()
    ? await createPinPhotoReadUrl(body.blobPath)
    : body.blobPath;
  res.json({ photo_url: body.blobPath, photo_view_url: photoViewUrl });
});

router.post('/pins/photo-urls', requireAuth, async (req: Request, res: Response) => {
  const body = validate(photoUrlsSchema, req.body, res);
  if (!body) return;
  if (body.pinIds.length === 0) {
    res.json({ urls: {} });
    return;
  }

  const db = await getDb();
  const request = db.request();
  const placeholders: string[] = [];
  body.pinIds.forEach((pinId, idx) => {
    const k = `id${idx}`;
    placeholders.push(`@${k}`);
    request.input(k, sql.Int, pinId);
  });

  const rows = await request.query(
    `SELECT id, photoUrl FROM InspectionPins WHERE id IN (${placeholders.join(',')})`
  );

  const urls: Record<string, string> = {};
  for (const row of rows.recordset) {
    const raw = (row.photoUrl as string | null) ?? '';
    if (!raw) continue;
    urls[String(row.id)] = isBlobStorageConfigured() ? await createPinPhotoReadUrl(raw) : raw;
  }
  res.json({ urls });
});

router.post('/jobs/:id/exterior-check', requireAuth, async (req: Request, res: Response) => {
  const body = validate(exteriorCheckSchema, req.body, res);
  if (!body) return;

  const ref = req.params.id;
  const db = await getDb();
  const current = await db.request()
    .input('ref', sql.NVarChar, ref)
    .query('SELECT TOP 1 id, remarks FROM Jobs WHERE id = @ref OR reference = @ref');
  if (!current.recordset[0]) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const marker = '[EXTERIOR_CHECK]';
  const cleaned = String(current.recordset[0].remarks ?? '')
    .split('\n')
    .filter((line) => !line.trim().startsWith(marker))
    .join('\n')
    .trim();

  const signedPayload = {
    checkedBy: body.checkedBy,
    checkedSignature: body.checkedSignature,
    receivedBy: body.receivedBy,
    receivedSignature: body.receivedSignature,
    gps: body.gps,
    submittedAt: new Date().toISOString(),
    submittedByUserId: (req as AuthedRequest).user.id,
  };
  const encoded = Buffer.from(JSON.stringify(signedPayload), 'utf8').toString('base64url');
  const nextRemarks = `${cleaned}${cleaned ? '\n' : ''}${marker}${encoded}`;

  await db.request()
    .input('jobId', sql.NVarChar, current.recordset[0].id)
    .input('remarks', sql.NVarChar, nextRemarks)
    .query('UPDATE Jobs SET remarks = @remarks WHERE id = @jobId');

  res.json({ success: true, submittedAt: signedPayload.submittedAt });
});

router.delete('/pins/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const db = await getDb();
  const existing = await db.request()
    .input('id', sql.Int, id)
    .query('SELECT photoUrl FROM InspectionPins WHERE id = @id');
  if (!existing.recordset[0]) { res.status(404).json({ error: 'Pin not found' }); return; }
  const result = await db.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM InspectionPins WHERE id = @id');
  if (result.rowsAffected[0] === 0) { res.status(404).json({ error: 'Pin not found' }); return; }
  const photoUrl = existing.recordset[0].photoUrl as string | null;
  if (photoUrl && isBlobStorageConfigured()) {
    await deletePinPhoto(photoUrl).catch(() => {});
  }
  res.json({ success: true });
});

export default router;
