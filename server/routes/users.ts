import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb, sql } from '../db/sql.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';
import { hashPassword } from '../utils/password.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDb();
  const result = await db.request().query(
    'SELECT id, username, role, name, createdAt FROM Users ORDER BY createdAt'
  );
  res.json(result.recordset);
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
  const id = crypto.randomUUID();
  try {
    const db = await getDb();
    await db.request()
      .input('id',   sql.NVarChar, id)
      .input('un',   sql.NVarChar, body.username)
      .input('hash', sql.NVarChar, await hashPassword(body.password))
      .input('role', sql.NVarChar, body.role)
      .input('name', sql.NVarChar, body.name)
      .query('INSERT INTO Users (id, username, passwordHash, role, name) VALUES (@id, @un, @hash, @role, @name)');
    res.status(201).json({ id });
  } catch {
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.delete('/:id', requireAuth, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const db = await getDb();
  await db.request()
    .input('id', sql.NVarChar, req.params.id)
    .query('DELETE FROM Users WHERE id = @id');
  res.json({ success: true });
});

export default router;
