import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const body = validate(loginSchema, req.body, res);
  if (!body) return;

  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name, createdAt: user.createdAt },
  });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json((req as AuthedRequest).user);
});

export default router;
