import { Router } from 'express';
import { z } from 'zod';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectType: z.enum(['static', 'node', 'react', 'vue', 'other']).default('static')
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 60);
}

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    let sql = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM domains d WHERE d.project_id = p.id) AS domain_count,
        (SELECT hostname FROM domains d WHERE d.project_id = p.id AND d.is_primary LIMIT 1) AS primary_domain
      FROM projects p
      WHERE p.admin_user_id = $1
    `;
    const params: any[] = [userId];
    let idx = 2;

    if (status) {
      sql += ` AND p.status = $${idx++}`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (p.name ILIKE $${idx} OR p.slug ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    sql += ` ORDER BY p.updated_at DESC`;

    const result = await query(sql, params);
    res.json({ projects: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const userId = req.user!.id;
    let slug = slugify(data.name);

    // Ensure unique slug for this user
    const existing = await query(
      'SELECT id FROM projects WHERE admin_user_id = $1 AND slug = $2',
      [userId, slug]
    );
    if (existing.rows.length > 0) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO projects (id, admin_user_id, name, slug, description, project_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [id, userId, data.name, slug, data.description || null, data.projectType]
    );

    // Audit
    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'project.created', 'project', $2, $3)`,
      [userId, id, JSON.stringify({ name: data.name })]
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, 
        (SELECT json_agg(d.*) FROM domains d WHERE d.project_id = p.id) AS domains
       FROM projects p
       WHERE p.id = $1 AND p.admin_user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { name, description, status } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      params.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      params.push(status);
    }
    updates.push(`updated_at = NOW()`);

    params.push(req.params.id, req.user!.id);

    const result = await query(
      `UPDATE projects SET ${updates.join(', ')}
       WHERE id = $${idx++} AND admin_user_id = $${idx}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `UPDATE projects SET status = 'archived', updated_at = NOW()
       WHERE id = $1 AND admin_user_id = $2
       RETURNING id`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
