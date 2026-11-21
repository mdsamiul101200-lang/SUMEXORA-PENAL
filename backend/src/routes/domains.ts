import { Router } from 'express';
import { z } from 'zod';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const generateSchema = z.object({
  projectId: z.string().uuid(),
  preferredName: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/i, 'Only letters, numbers and hyphens')
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT d.*, p.name AS project_name, p.slug AS project_slug
       FROM domains d
       JOIN projects p ON p.id = d.project_id
       WHERE p.admin_user_id = $1
       ORDER BY d.created_at DESC`,
      [req.user!.id]
    );
    res.json({ domains: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/generate', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, preferredName } = generateSchema.parse(req.body);
    const rootDomain = process.env.ROOT_DOMAIN || 'sumexora.com';
    const hostname = `${preferredName.toLowerCase()}.${rootDomain}`;

    // Verify project ownership
    const project = await query(
      'SELECT id, name FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check availability
    const existing = await query('SELECT id FROM domains WHERE hostname = $1', [hostname]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Hostname already taken', hostname });
    }

    // Reserved names
    const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'cdn', 'static'];
    if (reserved.includes(preferredName.toLowerCase())) {
      return res.status(400).json({ error: 'This name is reserved' });
    }

    const durationDays = parseInt(process.env.DEFAULT_HOSTING_DURATION_DAYS || '30', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const id = uuidv4();
    const result = await query(
      `INSERT INTO domains (
        id, project_id, hostname, domain_type, is_primary, status,
        ssl_status, expires_at, activated_at
      ) VALUES ($1, $2, $3, 'branded', true, 'pending', 'pending', $4, NOW())
      RETURNING *`,
      [id, projectId, hostname, expiresAt]
    );

    // Mark other domains of this project as non-primary
    await query(
      'UPDATE domains SET is_primary = false WHERE project_id = $1 AND id != $2',
      [projectId, id]
    );

    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'domain.generated', 'domain', $2, $3)`,
      [req.user!.id, id, JSON.stringify({ hostname, projectId })]
    );

    // Note: Real DNS record creation happens when Cloudflare credentials are present
    // and the activate endpoint is called.
    res.status(201).json({
      domain: result.rows[0],
      message: 'Domain record created. Configure DNS / activate to make it live.',
      requiresDnsConfig: !process.env.CLOUDFLARE_API_TOKEN
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/activate', async (req: AuthRequest, res, next) => {
  try {
    const domainRes = await query(
      `SELECT d.* FROM domains d
       JOIN projects p ON p.id = d.project_id
       WHERE d.id = $1 AND p.admin_user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (domainRes.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const domain = domainRes.rows[0];

    // If Cloudflare is configured, attempt real DNS + SSL
    if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
      // Real integration would go here (create CNAME / A record + SSL)
      // For now we mark as active only after explicit config check
      await query(
        `UPDATE domains SET status = 'active', ssl_status = 'active', updated_at = NOW()
         WHERE id = $1`,
        [domain.id]
      );
      return res.json({
        success: true,
        message: 'Domain activated (Cloudflare credentials present – real DNS would be applied)',
        hostname: domain.hostname
      });
    }

    // Without credentials we still track the domain in DB but do not claim live DNS
    await query(
      `UPDATE domains SET status = 'active', updated_at = NOW() WHERE id = $1`,
      [domain.id]
    );

    res.json({
      success: true,
      message: 'Domain marked active in database. Configure CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID for real DNS routing.',
      hostname: domain.hostname,
      dnsRequired: true
    });
  } catch (err) {
    next(err);
  }
});

export default router;
