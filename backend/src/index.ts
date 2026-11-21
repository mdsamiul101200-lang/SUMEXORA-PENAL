import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import domainRoutes from './routes/domains.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';
import aiRoutes from './routes/ai.js';
import deploymentRoutes from './routes/deployments.js';
import settingsRoutes from './routes/settings.js';
import filesRoutes from './routes/files.js';
import backupsRoutes from './routes/backups.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Allow Monaco & previews
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SUMEXORA PENAL API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/domains', authMiddleware, domainRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/deployments', authMiddleware, deploymentRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/files', authMiddleware, filesRoutes);
app.use('/api/backups', authMiddleware, backupsRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 SUMEXORA PENAL API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

export default app;
