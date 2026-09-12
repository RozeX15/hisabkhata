import mysql, { Pool, PoolOptions, RowDataPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: Pool | null = null;
let connectionTested = false;
let isConnected = false;
let lastError: string | null = null;

export function isMySqlConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME);
}

export function getMySqlConfig(): {
  host: string;
  port: number;
  user: string;
  database: string;
  hasPassword: boolean;
} {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'hishabkhata_db',
    hasPassword: Boolean(process.env.DB_PASSWORD),
  };
}

export function getMySqlPool(): Pool | null {
  if (pool) return pool;
  if (!isMySqlConfigured()) return null;

  try {
    const config: PoolOptions = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hishabkhata_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4',
    };

    pool = mysql.createPool(config);
    return pool;
  } catch (err: any) {
    console.error('[MySQL] Failed to initialize connection pool:', err.message);
    lastError = err.message;
    return null;
  }
}

export async function testMySqlConnection(): Promise<boolean> {
  const p = getMySqlPool();
  if (!p) {
    isConnected = false;
    connectionTested = true;
    return false;
  }

  try {
    const [rows] = await p.query<RowDataPacket[]>('SELECT 1 as is_alive');
    isConnected = Boolean(rows && rows.length > 0);
    lastError = null;
    connectionTested = true;
    return isConnected;
  } catch (err: any) {
    console.warn('[MySQL] Database connection test failed:', err.message);
    isConnected = false;
    lastError = err.message;
    connectionTested = true;
    return false;
  }
}

export async function getMySqlStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  tableCount: number;
  tables: string[];
  error?: string | null;
}> {
  const configured = isMySqlConfigured();
  const cfg = getMySqlConfig();

  if (!configured) {
    return {
      configured: false,
      connected: false,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      tableCount: 0,
      tables: [],
      error: 'DB_HOST and DB_NAME environment variables not set in .env',
    };
  }

  const p = getMySqlPool();
  if (!p) {
    return {
      configured: true,
      connected: false,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      tableCount: 0,
      tables: [],
      error: lastError || 'Could not instantiate connection pool',
    };
  }

  try {
    const [rows] = await p.query<RowDataPacket[]>('SHOW TABLES');
    const tables = rows.map((r: any) => Object.values(r)[0] as string);
    isConnected = true;
    lastError = null;

    return {
      configured: true,
      connected: true,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      tableCount: tables.length,
      tables,
      error: null,
    };
  } catch (err: any) {
    isConnected = false;
    lastError = err.message;
    return {
      configured: true,
      connected: false,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      tableCount: 0,
      tables: [],
      error: err.message,
    };
  }
}

export async function executeMySqlScript(script: string): Promise<{ success: boolean; executedStatements: number; error?: string }> {
  const p = getMySqlPool();
  if (!p) {
    return { success: false, executedStatements: 0, error: 'MySQL not configured or reachable' };
  }

  try {
    // Split script by semicolon lines (ignoring comments)
    const statements = script
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let count = 0;
    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('set ')) {
        continue; // handled by pool or default connection
      }
      await p.query(stmt);
      count++;
    }

    return { success: true, executedStatements: count };
  } catch (err: any) {
    console.error('[MySQL] Error executing SQL script:', err.message);
    return { success: false, executedStatements: 0, error: err.message };
  }
}

export function getDatabaseSqlContent(): string {
  const sqlPath = path.join(process.cwd(), 'database.sql');
  try {
    if (fs.existsSync(sqlPath)) {
      return fs.readFileSync(sqlPath, 'utf8');
    }
  } catch (err) {
    console.warn('Could not read database.sql from filesystem:', err);
  }
  return '';
}
