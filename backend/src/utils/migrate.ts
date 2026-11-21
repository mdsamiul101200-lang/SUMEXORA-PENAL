import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const schemaDir = path.join(__dirname, '../../../database/schema');
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql')).sort();

  console.log('Running migrations...');
  for (const file of files) {
    const sql = fs.readFileSync(path.join(schemaDir, file), 'utf8');
    console.log(`  → ${file}`);
    await pool.query(sql);
  }
  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
