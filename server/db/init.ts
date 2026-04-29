import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
  console.log('🔧 Initializing Azure SQL schema...');
  const db = await getDb();

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

  // Split on semicolons followed by a blank line — one IF/CREATE block per table
  const statements = schema
    .split(/;\s*\n\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    await db.request().query(stmt);
  }

  console.log('✅ Schema initialized — Users, Vehicles, WorkshopBays, Jobs, InspectionPins ready');
}

initDb().catch(e => { console.error('❌ Init failed:', e.message); process.exit(1); });
