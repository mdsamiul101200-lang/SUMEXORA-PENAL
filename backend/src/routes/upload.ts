import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const storagePath = process.env.STORAGE_PATH || './storage';
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(storagePath, 'uploads', uuidv4());
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  limits: {
    fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB || '100', 10)) * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      '.html', '.htm', '.css', '.js', '.json', '.png', '.jpg', '.jpeg',
      '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.zip',
      '.txt', '.md', '.xml', '.ts', '.tsx', '.jsx'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`));
    }
  }
});

router.post('/project/:projectId', upload.array('files', 50), async (req: AuthRequest, res, next) => {
  try {
    const projectId = req.params.projectId;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Verify ownership
    const proj = await query(
      'SELECT id, name FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) {
      // Cleanup
      files.forEach(f => fs.rmSync(path.dirname(f.path), { recursive: true, force: true }));
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectDir = path.join(storagePath, 'projects', projectId);
    fs.mkdirSync(projectDir, { recursive: true });

    let totalBytes = 0;
    const savedFiles: string[] = [];

    for (const file of files) {
      const dest = path.join(projectDir, file.originalname);
      // Prevent path traversal
      if (!dest.startsWith(projectDir)) {
        continue;
      }
      fs.renameSync(file.path, dest);
      totalBytes += file.size;
      savedFiles.push(file.originalname);
    }

    // Cleanup temp upload dirs
    files.forEach(f => {
      try { fs.rmSync(path.dirname(f.path), { recursive: true, force: true }); } catch {}
    });

    await query(
      `UPDATE projects 
       SET storage_path = $1, storage_used_bytes = storage_used_bytes + $2, 
           status = 'active', updated_at = NOW()
       WHERE id = $3`,
      [projectDir, totalBytes, projectId]
    );

    await query(
      `INSERT INTO audit_logs (admin_user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'project.files_uploaded', 'project', $2, $3)`,
      [req.user!.id, projectId, JSON.stringify({ files: savedFiles, bytes: totalBytes })]
    );

    res.json({
      success: true,
      files: savedFiles,
      totalBytes,
      projectPath: projectDir
    });
  } catch (err) {
    next(err);
  }
});

export default router;
