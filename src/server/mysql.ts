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

// -----------------------------------------------------------------------------
// Real MySQL Persistence Operations for Users & Authentication
// -----------------------------------------------------------------------------

export async function saveUserToMySql(user: any, passwordHash?: string): Promise<boolean> {
  const p = getMySqlPool();
  if (!p) return false;

  try {
    const query = `
      INSERT INTO \`users\` (
        \`id\`, \`name\`, \`email\`, \`phone\`, \`role\`, \`plan\`, \`status\`,
        \`avatar_url\`, \`preferred_currency\`, \`preferred_language\`, \`created_at\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`phone\` = VALUES(\`phone\`),
        \`role\` = VALUES(\`role\`),
        \`plan\` = VALUES(\`plan\`),
        \`status\` = VALUES(\`status\`),
        \`preferred_currency\` = VALUES(\`preferred_currency\`),
        \`preferred_language\` = VALUES(\`preferred_language\`);
    `;

    const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();

    await p.query(query, [
      user.id,
      user.name || 'User',
      user.email || null,
      user.phone || null,
      user.role || 'user',
      user.plan || 'free',
      user.status || 'active',
      user.avatarUrl || null,
      user.preferredCurrency || 'BDT',
      user.preferredLanguage || 'en',
      createdAt,
    ]);

    if (passwordHash) {
      const pwQuery = `
        INSERT INTO \`user_passwords\` (\`user_id\`, \`password_hash\`)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE \`password_hash\` = VALUES(\`password_hash\`);
      `;
      await p.query(pwQuery, [user.id, passwordHash]);
    }

    return true;
  } catch (err: any) {
    console.warn('[MySQL] Error saving user to MySQL database:', err.message);
    return false;
  }
}

export async function fetchUsersFromMySql(): Promise<any[] | null> {
  const p = getMySqlPool();
  if (!p) return null;

  try {
    const [rows] = await p.query<RowDataPacket[]>(
      'SELECT `id`, `name`, `email`, `phone`, `role`, `plan`, `status`, `avatar_url`, `preferred_currency`, `preferred_language`, `created_at`, `updated_at` FROM `users` ORDER BY `created_at` DESC'
    );

    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || undefined,
      role: r.role || 'user',
      plan: r.plan || 'free',
      status: r.status || 'active',
      avatarUrl: r.avatar_url || undefined,
      preferredCurrency: r.preferred_currency || 'BDT',
      preferredLanguage: r.preferred_language || 'en',
      emailVerified: true,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err: any) {
    console.warn('[MySQL] Error fetching users from MySQL:', err.message);
    return null;
  }
}

export async function findUserInMySql(identifier: string): Promise<{ user: any; passwordHash: string } | null> {
  const p = getMySqlPool();
  if (!p) return null;

  try {
    const clean = identifier.trim().toLowerCase();
    const query = `
      SELECT u.*, p.password_hash 
      FROM \`users\` u
      LEFT JOIN \`user_passwords\` p ON u.id = p.user_id
      WHERE LOWER(u.email) = ? OR u.phone = ? OR u.id = ?
      LIMIT 1;
    `;

    const [rows] = await p.query<RowDataPacket[]>(query, [clean, identifier.trim(), identifier.trim()]);
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const r = rows[0] as any;
    const user = {
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || undefined,
      role: r.role || 'user',
      plan: r.plan || 'free',
      status: r.status || 'active',
      avatarUrl: r.avatar_url || undefined,
      preferredCurrency: r.preferred_currency || 'BDT',
      preferredLanguage: r.preferred_language || 'en',
      emailVerified: true,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };

    return {
      user,
      passwordHash: r.password_hash || '',
    };
  } catch (err: any) {
    console.warn('[MySQL] Error finding user in MySQL:', err.message);
    return null;
  }
}

export async function deleteUserInMySql(userId: string): Promise<boolean> {
  const p = getMySqlPool();
  if (!p) return false;

  try {
    await p.query('DELETE FROM `users` WHERE `id` = ?', [userId]);
    return true;
  } catch (err: any) {
    console.warn('[MySQL] Error deleting user in MySQL:', err.message);
    return false;
  }
}

