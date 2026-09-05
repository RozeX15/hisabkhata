import express, { Request, Response, NextFunction } from 'express';
import apiRouter from './routes';

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hishab Khata',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hishab Khata',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount full-stack API routes on both /api and root /
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback error handler to ensure clean JSON responses
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    error: err?.message || 'Server error occurred. Please try again.',
    success: false,
  });
});

export default app;
