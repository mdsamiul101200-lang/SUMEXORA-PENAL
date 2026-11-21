import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';

const router = Router();
const storagePath = process.env.STORAGE_PATH || './storage';

router.get('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT pv.* FROM project_versions pv
       JOIN projects p ON p.id = pv.project_id
       WHERE pv.project_id = $1 AND p.admin_user_id = $2 AND pv.is_backup = true
       ORDER BY pv.created_at DESC`,
      [req.params.projectId, req.user!.id]
    );
    res.json({ backups: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/project/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const proj = await query(
      'SELECT id, name, storage_path, current_version FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const project = proj.rows[0];
    if (!project.storage_path || !fs.existsSync(project.storage_path)) {
      return res.status(400).json({ error: 'No project files to backup' });
    }

    const version = (project.current_version || 0) + 1;
    const backupDir = path.join(storagePath, 'backups', projectId);
    fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `v${version}-${Date.now()}.zip`);

    // Create zip archive
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(backupFile);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', () => resolve());
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(project.storage_path, false);
      archive.finalize();
    });

    const size = fs.statSync(backupFile).size;
    const id = uuidv4();

    await query(
      `INSERT INTO project_versions (id, project_id, version, storage_path, size_bytes, is_backup, change_summary, created_by)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
      [id, projectId, version, backupFile, size, req.body.summary || 'Manual backup', req.user!.id]
    );

    await query(
      `UPDATE projects SET current_version = $1, updated_at = NOW() WHERE id = $2`,
      [version, projectId]
    );

    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'backup.created', 'project', $2, $3)`,
      [req.user!.id, projectId, JSON.stringify({ version, size })]
    );

    res.status(201).json({
      success: true,
      backup: { id, version, size, path: backupFile }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
