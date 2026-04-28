import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb, sql } from '../db/sql.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

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

router.post('/pins', requireAuth, async (req: Request, res: Response) => {
  const body = validate(pinSchema, req.body, res);
  if (!body) return;
  const db = await getDb();
  const result = await db.request()
    .input('jobId',     sql.NVarChar, body.jobId ?? body.job_id ?? null)
    .input('vehicleId', sql.NVarChar, body.vehicleId ?? body.vehicle_id ?? null)
    .input('x',         sql.Float,    body.x)
    .input('y',         sql.Float,    body.y)
    .input('type',      sql.NVarChar, body.type.toUpperCase())
    .input('note',      sql.NVarChar, body.note ?? null)
    .input('photoUrl',  sql.NVarChar, body.photoUrl ?? body.photo_url ?? null)
    .query('INSERT INTO InspectionPins (jobId, vehicleId, x, y, type, note, photoUrl) OUTPUT INSERTED.id VALUES (@jobId, @vehicleId, @x, @y, @type, @note, @photoUrl)');
  res.status(201).json({ id: result.recordset[0].id });
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

router.delete('/pins/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const db = await getDb();
  const result = await db.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM InspectionPins WHERE id = @id');
  if (result.rowsAffected[0] === 0) { res.status(404).json({ error: 'Pin not found' }); return; }
  res.json({ success: true });
});

export default router;
