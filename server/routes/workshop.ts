import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';

const router = Router();

router.get('/bays', requireAuth, async (_req: Request, res: Response) => {
  const bays = await prisma.workshopBay.findMany({ orderBy: { name: 'asc' } });
  res.json(bays);
});

router.patch('/bays/:id', requireAuth, requireRole(UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { status, technician, currentJobId } = req.body;
    const bay = await prisma.workshopBay.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(technician !== undefined && { technician }),
        ...(currentJobId !== undefined && { currentJobId }),
      },
    });
    res.json(bay);
  }
);

export default router;
