import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './data/sync.db';

let db: Database.Database;

export function initializeDatabase() {
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
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

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    initializeDatabase();
  }
  return db;
}

// Project operations
export function getAllProjects() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
}

export function getProject(id: string) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data: {
  id: string;
  title: string;
  description?: string;
  tech_stack?: string;
  github_url?: string;
  is_from_github?: boolean;
}) {
  const db = getDatabase();
  const stmt = db.prepare(`
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
  const db = getDatabase();
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(', ');

  const stmt = db.prepare(
    `UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );

  return stmt.run(...Object.values(data), id);
}

export function updateProjectSyncStatus(
  id: string,
  platform: string,
  status: 'success' | 'failed' | 'pending'
) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  if (platform === 'linkedin') {
    db.prepare('UPDATE projects SET last_synced_to_linkedin = ? WHERE id = ?').run(
      timestamp,
      id
    );
  } else if (platform === 'twitter') {
    db.prepare('UPDATE projects SET last_synced_to_twitter = ? WHERE id = ?').run(
      timestamp,
      id
    );
  } else if (platform === 'portfolio') {
    db.prepare('UPDATE projects SET last_synced_to_portfolio = ? WHERE id = ?').run(
      timestamp,
      id
    );
  }
}

export function deleteProject(id: string) {
  const db = getDatabase();
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// Sync log operations
export function insertSyncLog(data: {
  project_id?: string;
  platform: string;
  status: string;
  message: string;
  reasoning?: string;
}) {
  const db = getDatabase();
  const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
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
  const db = getDatabase();
  return db.prepare('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// Agent state operations
export function getAgentState(key: string): string | null {
  const db = getDatabase();
  const result: any = db.prepare('SELECT value FROM agent_state WHERE key = ?').get(key);
  return result?.value || null;
}

export function setAgentState(key: string, value: string) {
  const db = getDatabase();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
  );
  return stmt.run(key, value);
}

export function closeDatabase() {
  if (db) {
    db.close();
  }
}
