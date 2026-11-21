import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const storagePath = process.env.STORAGE_PATH || './storage';

function safePath(projectId: string, relativePath: string = '') {
  const base = path.resolve(storagePath, 'projects', projectId);
  const target = path.resolve(base, relativePath || '.');
  if (!target.startsWith(base)) {
    throw Object.assign(new Error('Path traversal detected'), { status: 400 });
  }
  return { base, target };
}

// List files/folders for a project
router.get('/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const rel = (req.query.path as string) || '';

    const proj = await query(
      'SELECT id, storage_path FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { target } = safePath(projectId, rel);
    if (!fs.existsSync(target)) {
      return res.json({ path: rel, items: [] });
    }

    const entries = fs.readdirSync(target, { withFileTypes: true });
    const items = entries.map(e => {
      const full = path.join(target, e.name);
      const stat = fs.statSync(full);
      return {
        name: e.name,
        type: e.isDirectory() ? 'folder' : 'file',
        size: stat.size,
        modified: stat.mtime,
        extension: e.isFile() ? path.extname(e.name).toLowerCase() : null
      };
    });

    res.json({ path: rel, items });
  } catch (err) {
    next(err);
  }
});

// Read file content
router.get('/:projectId/content', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const rel = req.query.path as string;
    if (!rel) return res.status(400).json({ error: 'path required' });

    const proj = await query(
      'SELECT id FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { target } = safePath(projectId, rel);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(target, 'utf8');
    res.json({ path: rel, content });
  } catch (err) {
    next(err);
  }
});

// Save file content
router.put('/:projectId/content', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const { path: rel, content } = req.body;
    if (!rel || content === undefined) return res.status(400).json({ error: 'path and content required' });

    const proj = await query(
      'SELECT id FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { target } = safePath(projectId, rel);
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(target, content, 'utf8');

    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'file.saved', 'project', $2, $3)`,
      [req.user!.id, projectId, JSON.stringify({ path: rel })]
    );

    res.json({ success: true, path: rel });
  } catch (err) {
    next(err);
  }
});

// Create folder
router.post('/:projectId/folder', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const { path: rel } = req.body;
    if (!rel) return res.status(400).json({ error: 'path required' });

    const proj = await query(
      'SELECT id FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { target } = safePath(projectId, rel);
    fs.mkdirSync(target, { recursive: true });
    res.json({ success: true, path: rel });
  } catch (err) {
    next(err);
  }
});

// Delete file/folder
router.delete('/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const rel = req.query.path as string;
    if (!rel) return res.status(400).json({ error: 'path required' });

    const proj = await query(
      'SELECT id FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const { target } = safePath(projectId, rel);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
