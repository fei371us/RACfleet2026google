import { Router, Request, Response } from 'express';
import { getDb } from '../db/sql.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, UserRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { sql } from '../db/sql.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const db = await getDb();
  const result = await db.request().query('SELECT * FROM Vehicles ORDER BY name');
  res.json(result.recordset);
});

const upsertVehicleSchema = z.object({
  name: z.string().min(1),
  plate: z.string().min(1),
  status: z.string().optional(),
});

router.post('/',
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const body = validate(upsertVehicleSchema, req.body, res);
    if (!body) return;
    const db = await getDb();
    const id = crypto.randomUUID();
    const status = body.status?.trim() || 'active';
    const result = await db.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, body.name.trim())
      .input('plate', sql.NVarChar, body.plate.trim())
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO Vehicles (id, name, plate, status)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @plate, @status)
      `);
    res.status(201).json(result.recordset[0]);
  }
);

router.patch('/:id',
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response) => {
    const body = validate(upsertVehicleSchema, req.body, res);
    if (!body) return;
    const db = await getDb();
    const existing = await db.request()
      .input('id', sql.NVarChar, req.params.id)
      .query('SELECT id FROM Vehicles WHERE id = @id');
    if (!existing.recordset[0]) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    const status = body.status?.trim() || 'active';
    const result = await db.request()
      .input('id', sql.NVarChar, req.params.id)
      .input('name', sql.NVarChar, body.name.trim())
      .input('plate', sql.NVarChar, body.plate.trim())
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Vehicles
        SET name = @name, plate = @plate, status = @status
        WHERE id = @id;
        SELECT * FROM Vehicles WHERE id = @id;
      `);
    res.json(result.recordset[0]);
  }
);

router.delete('/:id',
  requireAuth,
  requireRole(UserRole.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      const result = await db.request()
        .input('id', sql.NVarChar, req.params.id)
        .query('DELETE FROM Vehicles WHERE id = @id');
      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Delete failed';
      if (msg.includes('REFERENCE constraint')) {
        res.status(400).json({ error: 'Vehicle is assigned in jobs and cannot be deleted.' });
        return;
      }
      res.status(500).json({ error: msg });
    }
  }
);

export default router;
