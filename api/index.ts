import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

let cachedApp: any = null;

function resolveApp() {
  if (cachedApp) return cachedApp;

  // 1. Primary: load bundled self-contained CommonJS application
  try {
    const require = createRequire(import.meta.url);
    const cjsPath = path.join(process.cwd(), 'api', 'index.cjs');
    if (fs.existsSync(cjsPath)) {
      const mod = require(cjsPath);
      cachedApp = mod.default || mod;
      return cachedApp;
    }
  } catch (err) {
    console.warn('Could not load api/index.cjs bundle:', err);
  }

  // 2. Fallback: load relative bundle if working directory differs
  try {
    const require = createRequire(import.meta.url);
    const mod = require('./index.cjs');
    cachedApp = mod.default || mod;
    return cachedApp;
  } catch (err) {
    console.error('Failed to load serverless application handler:', err);
  }

  return (req: any, res: any) => {
    res.status(500).json({
      error: 'API server handler is initializing. Please try again shortly.',
      success: false,
    });
  };
}

export default function handler(req: any, res: any) {
  const app = resolveApp();
  return app(req, res);
}
