import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query, pool } from './db.js';

dotenv.config();

async function seed() {
  console.log('Seeding SUMEXORA PENAL...');

  const email = 'admin@sumexora.com';
  const password = 'ChangeMeImmediately!';
  const hash = await bcrypt.hash(password, 12);

  const existing = await query('SELECT id FROM admin_users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log('Admin user already exists.');
  } else {
    await query(
      `INSERT INTO admin_users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'administrator')`,
      [email, hash, 'Sumon i!']
    );
    console.log(`Created admin: ${email} / ${password}`);
  }

  // Assign enterprise plan subscription
  const user = await query('SELECT id FROM admin_users WHERE email = $1', [email]);
  const plan = await query("SELECT id FROM hosting_plans WHERE slug = 'enterprise'");
  if (user.rows.length && plan.rows.length) {
    const subCheck = await query(
      'SELECT id FROM subscriptions WHERE admin_user_id = $1',
      [user.rows[0].id]
    );
    if (subCheck.rows.length === 0) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await query(
        `INSERT INTO subscriptions (admin_user_id, plan_id, status, expires_at)
         VALUES ($1, $2, 'active', $3)`,
        [user.rows[0].id, plan.rows[0].id, expires]
      );
      console.log('Assigned Enterprise subscription.');
    }
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
