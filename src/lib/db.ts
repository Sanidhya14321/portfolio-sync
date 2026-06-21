import fs from 'fs';
import path from 'path';

// ── Database back-ends ───────────────────────────────────────────────────────

type SQLiteDB = any;

let db: SQLiteDB | null = null;
let useJsonFallback = false;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

interface JsonDb {
  projects: any[];
  sync_logs: any[];
  agent_state: Record<string, string>;
}

function readJsonDb(): JsonDb {
  if (!fs.existsSync(JSON_DB_PATH)) {
    return { projects: [], sync_logs: [], agent_state: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
  } catch {
    return { projects: [], sync_logs: [], agent_state: {} };
  }
}

function writeJsonDb(data: JsonDb) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
}

// ── SQLite initialization (with graceful fallback) ───────────────────────────

export function initializeDatabase() {
  try {
    // Attempt to load better-sqlite3 dynamically
    const Database = require('better-sqlite3');
    const dbPath = process.env.DATABASE_PATH || './data/sync.db';
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        tech_stack TEXT,
        github_url TEXT UNIQUE,
        is_from_github BOOLEAN DEFAULT 1,
        linkedin_post TEXT,
        twitter_update TEXT,
        portfolio_description TEXT,
        last_synced_to_linkedin DATETIME,
        last_synced_to_twitter DATETIME,
        last_synced_to_portfolio DATETIME,
        sync_status TEXT DEFAULT 'pending',
        sync_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        platform TEXT,
        status TEXT,
        message TEXT,
        reasoning TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS agent_state (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_project_status ON projects(sync_status);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_project ON sync_logs(project_id);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_platform ON sync_logs(platform);
    `);

    useJsonFallback = false;
    console.log('[DB] Using SQLite (better-sqlite3)');
    return db;
  } catch (err) {
    console.warn('[DB] better-sqlite3 not available, using JSON fallback:', (err as Error).message);
    useJsonFallback = true;
    db = null;

    // Ensure JSON db file exists with schema
    if (!fs.existsSync(JSON_DB_PATH)) {
      writeJsonDb({ projects: [], sync_logs: [], agent_state: {} });
    }
    console.log('[DB] Using JSON file store');
    return null;
  }
}

export function getDatabase(): SQLiteDB {
  if (!db && !useJsonFallback) {
    initializeDatabase();
  }
  return db;
}

// ── Project operations ───────────────────────────────────────────────────────

export function getAllProjects() {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const data = readJsonDb();
    return data.projects.sort((a: any, b: any) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }
  const database = getDatabase();
  return database.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
}

export function getProject(id: string) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const data = readJsonDb();
    return data.projects.find((p: any) => p.id === id) || null;
  }
  const database = getDatabase();
  return database.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data: {
  id: string;
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  is_from_github?: boolean;
}) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const dbData = readJsonDb();
    const project = {
      id: data.id,
      title: data.title,
      description: data.description || null,
      tech_stack: data.tech_stack || null,
      github_url: data.github_url || null,
      is_from_github: data.is_from_github !== undefined ? (data.is_from_github ? 1 : 0) : 1,
      linkedin_post: null,
      twitter_update: null,
      portfolio_description: null,
      last_synced_to_linkedin: null,
      last_synced_to_twitter: null,
      last_synced_to_portfolio: null,
      sync_status: 'pending',
      sync_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dbData.projects.push(project);
    writeJsonDb(dbData);
    return { changes: 1 };
  }

  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO projects (id, title, description, tech_stack, github_url, is_from_github)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    data.id,
    data.title,
    data.description || null,
    data.tech_stack || null,
    data.github_url || null,
    data.is_from_github !== undefined ? (data.is_from_github ? 1 : 0) : 1
  );
}

export function updateProject(id: string, data: Partial<any>) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const dbData = readJsonDb();
    const idx = dbData.projects.findIndex((p: any) => p.id === id);
    if (idx === -1) return { changes: 0 };
    dbData.projects[idx] = { ...dbData.projects[idx], ...data, updated_at: new Date().toISOString() };
    writeJsonDb(dbData);
    return { changes: 1 };
  }

  const database = getDatabase();
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(', ');
  const stmt = database.prepare(
    `UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  return stmt.run(...Object.values(data), id);
}

export function updateProjectSyncStatus(
  id: string,
  platform: string,
  status: 'success' | 'failed' | 'pending'
) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const dbData = readJsonDb();
    const idx = dbData.projects.findIndex((p: any) => p.id === id);
    if (idx === -1) return { changes: 0 };
    const timestamp = new Date().toISOString();
    if (platform === 'linkedin') dbData.projects[idx].last_synced_to_linkedin = timestamp;
    if (platform === 'twitter') dbData.projects[idx].last_synced_to_twitter = timestamp;
    if (platform === 'portfolio') dbData.projects[idx].last_synced_to_portfolio = timestamp;
    writeJsonDb(dbData);
    return { changes: 1 };
  }

  const database = getDatabase();
  const timestamp = new Date().toISOString();
  if (platform === 'linkedin') {
    database.prepare('UPDATE projects SET last_synced_to_linkedin = ? WHERE id = ?').run(timestamp, id);
  } else if (platform === 'twitter') {
    database.prepare('UPDATE projects SET last_synced_to_twitter = ? WHERE id = ?').run(timestamp, id);
  } else if (platform === 'portfolio') {
    database.prepare('UPDATE projects SET last_synced_to_portfolio = ? WHERE id = ?').run(timestamp, id);
  }
}

export function deleteProject(id: string) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const dbData = readJsonDb();
    const before = dbData.projects.length;
    dbData.projects = dbData.projects.filter((p: any) => p.id !== id);
    dbData.sync_logs = dbData.sync_logs.filter((l: any) => l.project_id !== id);
    writeJsonDb(dbData);
    return { changes: before - dbData.projects.length };
  }
  const database = getDatabase();
  return database.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ── Sync log operations ──────────────────────────────────────────────────────

export function insertSyncLog(data: {
  project_id?: string;
  platform: string;
  status: string;
  message: string;
  reasoning?: string;
}) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const dbData = readJsonDb();
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dbData.sync_logs.push({
      id,
      project_id: data.project_id || null,
      platform: data.platform,
      status: data.status,
      message: data.message,
      reasoning: data.reasoning || null,
      timestamp: new Date().toISOString(),
    });
    writeJsonDb(dbData);
    return { changes: 1 };
  }

  const database = getDatabase();
  const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const stmt = database.prepare(`
    INSERT INTO sync_logs (id, project_id, platform, status, message, reasoning)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    id,
    data.project_id || null,
    data.platform,
    data.status,
    data.message,
    data.reasoning || null
  );
}

export function getSyncLogs(limit: number = 50) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const data = readJsonDb();
    return data.sync_logs
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  const database = getDatabase();
  return database.prepare('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ── Agent state operations ───────────────────────────────────────────────────

export function getAgentState(key: string): string | null {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const data = readJsonDb();
    return data.agent_state[key] || null;
  }
  const database = getDatabase();
  const result: any = database.prepare('SELECT value FROM agent_state WHERE key = ?').get(key);
  return result?.value || null;
}

export function setAgentState(key: string, value: string) {
  if (!db && !useJsonFallback) initializeDatabase();
  if (useJsonFallback) {
    const data = readJsonDb();
    data.agent_state[key] = value;
    writeJsonDb(data);
    return { changes: 1 };
  }
  const database = getDatabase();
  const stmt = database.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
  );
  return stmt.run(key, value);
}

export function closeDatabase() {
  if (db && !useJsonFallback) {
    db.close();
  }
}
