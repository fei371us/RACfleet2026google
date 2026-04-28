import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';
import { hashPassword } from '../utils/password.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, name: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

const createSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(6),
  role: z.string(),
  name: z.string().min(1),
});

router.post('/', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const body = validate(createSchema, req.body, res);
  if (!body) return;
  try {
    const user = await prisma.user.create({
      data: { username: body.username, passwordHash: await hashPassword(body.password), role: body.role, name: body.name },
    });
    res.status(201).json({ id: user.id });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.delete('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
