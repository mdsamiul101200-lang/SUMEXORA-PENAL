import { Router } from 'express';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/overview', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const [projects, deployments, domains, recentActivity] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'live' OR status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'live')::int AS live,
          COUNT(*) FILTER (WHERE is_connected = true)::int AS connected,
          COALESCE(SUM(storage_used_bytes), 0)::bigint AS storage_used
        FROM projects WHERE admin_user_id = $1 AND status != 'archived'
      `, [userId]),
      
      query(`
        SELECT COUNT(*)::int AS failed
        FROM deployments d
        JOIN projects p ON p.id = d.project_id
        WHERE p.admin_user_id = $1 AND d.status = 'failed'
          AND d.created_at > NOW() - INTERVAL '30 days'
      `, [userId]),

      query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active,
          COUNT(*) FILTER (WHERE status = 'expiring')::int AS expiring,
          COUNT(*) FILTER (WHERE status = 'expired')::int AS expired
        FROM domains d
        JOIN projects p ON p.id = d.project_id
        WHERE p.admin_user_id = $1
      `, [userId]),

      query(`
        SELECT 
          al.action, al.resource_type, al.details, al.created_at,
          p.name AS project_name
        FROM audit_logs al
        LEFT JOIN projects p ON p.id = al.resource_id
        WHERE al.admin_user_id = $1
        ORDER BY al.created_at DESC
        LIMIT 10
      `, [userId])
    ]);

    const p = projects.rows[0];
    const d = domains.rows[0];

    res.json({
      stats: {
        totalProjects: p.total,
        activeProjects: p.active,
        liveProjects: p.live,
        connectedProjects: p.connected,
        failedDeployments: deployments.rows[0].failed,
        storageUsedBytes: Number(p.storage_used),
        domains: {
          total: d.total,
          active: d.active,
          expiring: d.expiring,
          expired: d.expired
        }
      },
      systemHealth: {
        backend: 99.9,
        database: 100,
        storage: 95,
        security: 100,
        performance: 99
      },
      recentActivity: recentActivity.rows.map(r => ({
        action: r.action,
        resourceType: r.resource_type,
        projectName: r.project_name,
        details: r.details,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
