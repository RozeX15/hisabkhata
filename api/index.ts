import express, { Request, Response } from 'express';
import apiRouter from '../src/server/routes';

const app = express();

// Middleware for parsing JSON and urlencoded data with high limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Global CORS configuration for Vercel preview URLs, production, and localhost
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hishab Khata',
    version: '2.4.0',
    platform: 'vercel',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Hishab Khata',
    version: '2.4.0',
    platform: 'vercel',
    timestamp: new Date().toISOString(),
  });
});

// Mount full-stack API routes on /api and root /
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global fallback error handler to prevent opaque Vercel 500 crashes
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error in Vercel API function:', err);
  res.status(500).json({
    error: err?.message || 'Server error occurred. Please try again.',
    success: false
  });
});

// Export default handler for Vercel Serverless Function
export default app;
