import { Router, Request, Response } from 'express';
import { getDb } from '../db/sql.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDb();
  const result = await db.request().query('SELECT * FROM Vehicles ORDER BY name');
  res.json(result.recordset);
});

export default router;
