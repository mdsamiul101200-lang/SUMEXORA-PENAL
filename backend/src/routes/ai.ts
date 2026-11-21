import { Router } from 'express';
import { z } from 'zod';
import { query } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const instructionSchema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().min(5).max(2000)
});

router.post('/command', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, instruction } = instructionSchema.parse(req.body);

    const proj = await query(
      'SELECT id, name, storage_path FROM projects WHERE id = $1 AND admin_user_id = $2',
      [projectId, req.user!.id]
    );
    if (proj.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const opId = uuidv4();
    await query(
      `INSERT INTO ai_operations (id, project_id, admin_user_id, instruction, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [opId, projectId, req.user!.id, instruction]
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      await query(
        `UPDATE ai_operations SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`,
        ['GEMINI_API_KEY not configured', opId]
      );
      return res.status(503).json({
        error: 'AI provider not configured',
        message: 'Set GEMINI_API_KEY in environment to enable AI Command Center',
        operationId: opId
      });
    }

    // Real Gemini integration would analyze project files and propose diffs here.
    // Placeholder response structure that the frontend expects.
    await query(
      `UPDATE ai_operations SET status = 'proposing', proposed_changes = $1 WHERE id = $2`,
      [JSON.stringify({
        summary: `Analyzed instruction: "${instruction}"`,
        files: [],
        note: 'Full AI analysis requires the Gemini API call implementation with project context.'
      }), opId]
    );

    res.json({
      operationId: opId,
      status: 'proposing',
      message: 'AI analysis started. Review proposed changes before applying.',
      requiresApproval: true
    });
  } catch (err) {
    next(err);
  }
});

router.get('/operations/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const result = await query(
      `SELECT ao.* FROM ai_operations ao
       JOIN projects p ON p.id = ao.project_id
       WHERE ao.project_id = $1 AND p.admin_user_id = $2
       ORDER BY ao.created_at DESC LIMIT 20`,
      [req.params.projectId, req.user!.id]
    );
    res.json({ operations: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
