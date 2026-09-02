import express from 'express';
import apiRouter from './routes';

export function createExpressApp() {
  const app = express();

  // JSON parsing middleware
  app.use(express.json());

  // Mount API routes
  app.use('/api', apiRouter);
  // Also handle without /api prefix if stripped by functions proxy
  app.use('/', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'Hishab Khata',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
