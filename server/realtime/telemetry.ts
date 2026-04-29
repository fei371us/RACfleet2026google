import { Server } from 'socket.io';
import { getDb, sql } from '../db/sql.js';

export function initTelemetry(io: Server): void {
  setInterval(async () => {
    try {
      const db = await getDb();
      const vehicles = await db.request().query('SELECT id, lat, lng FROM Vehicles');
      for (const v of vehicles.recordset) {
        await db.request()
          .input('lat', sql.Float,    v.lat + (Math.random() - 0.5) * 0.001)
          .input('lng', sql.Float,    v.lng + (Math.random() - 0.5) * 0.001)
          .input('id',  sql.NVarChar, v.id)
          .query('UPDATE Vehicles SET lat = @lat, lng = @lng WHERE id = @id');
      }
      const updated = await db.request().query('SELECT * FROM Vehicles');
      io.emit('fleet:telemetry', updated.recordset);
    } catch { /* swallow telemetry errors — DB may be auto-pausing */ }
  }, 3000);
}
