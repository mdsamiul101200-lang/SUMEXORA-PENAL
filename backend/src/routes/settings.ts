import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  res.json({
    rootDomain: process.env.ROOT_DOMAIN || 'sumexora.com',
    aiConfigured: !!process.env.GEMINI_API_KEY,
    cloudflareConfigured: !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID),
    renderConfigured: !!process.env.RENDER_API_KEY,
    storagePath: process.env.STORAGE_PATH || './storage',
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '100', 10)
  });
});

export default router;
