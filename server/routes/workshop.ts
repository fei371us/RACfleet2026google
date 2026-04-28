import { Router, Request, Response } from 'express';
import { getDb, sql } from '../db/sql.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';

const router = Router();

router.get('/bays', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDb();
  const result = await db.request().query('SELECT * FROM WorkshopBays ORDER BY name');
  res.json(result.recordset);
});

router.patch('/bays/:id', requireAuth, requireRole(UserRole.WORKSHOP_ADVISER, UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const { status, technician, currentJobId } = req.body;
    const db = await getDb();
    const updates: string[] = [];
    const request = db.request().input('id', sql.NVarChar, req.params.id);
    if (status !== undefined)       { updates.push('status = @status');             request.input('status',       sql.NVarChar, status); }
    if (technician !== undefined)   { updates.push('technician = @technician');     request.input('technician',   sql.NVarChar, technician); }
    if (currentJobId !== undefined) { updates.push('currentJobId = @currentJobId'); request.input('currentJobId', sql.NVarChar, currentJobId); }
    if (updates.length === 0) { res.json({ success: true }); return; }
    await request.query(`UPDATE WorkshopBays SET ${updates.join(', ')} WHERE id = @id`);
    const updated = await db.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('SELECT * FROM WorkshopBays WHERE id = @id');
    res.json(updated.recordset[0]);
  }
);

export default router;
