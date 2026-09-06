/**
 * Trading Intelligence Server Entry Point
 * Express API + Vite Middleware Full-Stack Architecture
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.ts';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Request ID and structured logging middleware
  app.use((req, res, next) => {
    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    res.setHeader('X-Request-Id', requestId);
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) [${requestId}]`);
      }
    });
    next();
  });

  // Mount API routes under /api/v1 and legacy /api aliases
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Vite Middleware for SPA client
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`⚡ Trading Intelligence Engine running on port ${PORT}`);
    console.log(`⚡ API Endpoints: http://localhost:${PORT}/api/v1/health`);
    console.log(`⚡ WebSocket / SSE Stream: http://localhost:${PORT}/api/v1/events`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
