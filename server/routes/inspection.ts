import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const pinSchema = z.object({
  job_id: z.string().optional(), jobId: z.string().optional(),
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
  const pin = await prisma.inspectionPin.create({
    data: {
      jobId: (body.jobId ?? body.job_id) as string,
      vehicleId: (body.vehicleId ?? body.vehicle_id) as string,
      x: body.x,
      y: body.y,
      type: body.type.toUpperCase(),
      note: body.note,
      photoUrl: body.photoUrl ?? body.photo_url,
    },
  });
  res.status(201).json({ id: pin.id });
});

router.patch('/pins/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = await prisma.inspectionPin.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ error: 'Pin not found' }); return; }
  const { type, note, photo_url, photoUrl } = req.body;
  const updated = await prisma.inspectionPin.update({
    where: { id },
    data: {
      ...(type !== undefined && { type: type.toUpperCase() }),
      ...(note !== undefined && { note }),
      ...((photoUrl ?? photo_url) !== undefined && { photoUrl: photoUrl ?? photo_url }),
    },
  });
  res.json(updated);
});

router.delete('/pins/:id', requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.inspectionPin.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Pin not found' });
  }
});

export default router;
