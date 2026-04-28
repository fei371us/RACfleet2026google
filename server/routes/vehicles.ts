import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { name: 'asc' } });
  res.json(vehicles);
});

export default router;
