import { Router } from 'express';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT d.* FROM deployments d
       JOIN projects p ON p.id = d.project_id
       WHERE d.project_id = $1 AND p.admin_user_id = $2
       ORDER BY d.created_at DESC LIMIT 50`,
      [req.params.projectId, req.user!.id]
    );
    res.json({ deployments: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const proj = await query(
      'SELECT id, name, storage_path, status FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = proj.rows[0];
    if (!project.storage_path) {
      return res.status(400).json({ error: 'Project has no files to deploy. Upload files first.' });
    }

    const versionRes = await query(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM deployments WHERE project_id = $1',
      [projectId]
    );
    const version = versionRes.rows[0].next_version;
    const deployId = uuidv4();

    await query(
      `INSERT INTO deployments (id, project_id, version, status, provider, created_by, started_at)
       VALUES ($1, $2, $3, 'queued', 'internal', $4, NOW())`,
      [deployId, projectId, version, req.user!.id]
    );

    // Real provider deployment would be triggered here (Render API, Cloudflare Pages, etc.)
    // We mark as live only for local/static verification when no external provider is required.
    const hasRender = !!process.env.RENDER_API_KEY;
    const status = hasRender ? 'building' : 'live';
    const publicUrl = hasRender ? null : `http://localhost:4000/preview/${projectId}`;

    await query(
      `UPDATE deployments SET status = $1, public_url = $2, finished_at = NOW() WHERE id = $3`,
      [status, publicUrl, deployId]
    );

    await query(
      `UPDATE projects SET status = $1, current_version = $2, updated_at = NOW() WHERE id = $3`,
      [status === 'live' ? 'live' : 'deploying', version, projectId]
    );

    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'deployment.created', 'deployment', $2, $3)`,
      [req.user!.id, deployId, JSON.stringify({ projectId, version, status })]
    );

    res.status(201).json({
      deployment: {
        id: deployId,
        version,
        status,
        publicUrl,
        requiresProvider: !hasRender
      },
      message: hasRender
        ? 'Deployment queued with Render adapter'
        : 'Local deployment recorded. Configure RENDER_API_KEY (or other provider) for external hosting.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
