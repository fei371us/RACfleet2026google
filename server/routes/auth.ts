import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb, sql } from '../db/sql.js';
import { verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth, AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const body = validate(loginSchema, req.body, res);
  if (!body) return;

  const db = await getDb();
  const result = await db.request()
    .input('username', sql.NVarChar, body.username)
    .query('SELECT id, username, passwordHash, role, name, createdAt FROM Users WHERE username = @username');

  const user = result.recordset[0];
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
