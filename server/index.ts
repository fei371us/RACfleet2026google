import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config.js';
import { initTelemetry } from './realtime/telemetry.js';
import { errorHandler } from './middleware/error.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import vehiclesRouter from './routes/vehicles.js';
import jobsRouter from './routes/jobs.js';
import inspectionRouter from './routes/inspection.js';
import workshopRouter from './routes/workshop.js';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.json());

  // API routes
  app.use('/api/auth', authRouter);
  // Legacy login alias
  app.post('/api/login', (req, res, next) => {
    req.url = '/login';
    (authRouter as any)(req, res, next);
  });
  app.use('/api/users', usersRouter);
  app.use('/api/vehicles', vehiclesRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/inspection', inspectionRouter);
  app.use('/api/workshop', workshopRouter);

  app.use(errorHandler);

  // Frontend
  if (config.isDev) {
    const { createServer: createVite } = await import('vite');
    const vite = await createVite({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  initTelemetry(io);

  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${config.port}`);
  });
}

startServer().catch(console.error);
