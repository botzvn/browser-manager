/**
 * Core schema: tables shared between Core and Pro editions.
 * Uses IF NOT EXISTS for safe re-run on existing databases.
 *
 * NOTE: better-sqlite3 (used in Core) does NOT allow multiple statements
 * in a single db.raw() call. Each statement must be called separately.
 */
export async function up(db) {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      os TEXT NOT NULL DEFAULT 'linux',
      browser_type TEXT NOT NULL DEFAULT 'botzvn',
      proxy_type TEXT,
      proxy_host TEXT,
      proxy_port INTEGER,
      proxy_username TEXT,
      proxy_password TEXT,
      proxy_reset_url TEXT,
      platform_url TEXT,
      platform_tabs TEXT,
      platform_username TEXT,
      platform_password TEXT,
      platform_2fa TEXT,
      fingerprint TEXT NOT NULL DEFAULT '{}',
      cookies TEXT NOT NULL DEFAULT '[]',
      startup_args TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'stopped',
      user_agent TEXT,
      is_deleted INTEGER DEFAULT 0,
      group_id TEXT,
      user_data_dir TEXT,
      botzvn_config_path TEXT,
      botzvn_token TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await db.raw(`CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name)`);
  await db.raw(`CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status)`);
  await db.raw(`CREATE INDEX IF NOT EXISTS idx_profiles_deleted ON profiles(is_deleted)`);
  await db.raw(`CREATE INDEX IF NOT EXISTS idx_profiles_group ON profiles(group_id)`);

  await db.raw(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#64748b',
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.raw(`
    CREATE TABLE IF NOT EXISTS profile_extensions (
      profile_id TEXT NOT NULL,
      extension_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (profile_id, extension_id)
    )
  `);

  await db.raw(`
    CREATE TABLE IF NOT EXISTS proxies (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT NOT NULL DEFAULT 'http',
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      username TEXT,
      password TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      country_code TEXT,
      latency INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

export async function down(db) {
  await db.raw(`DROP TABLE IF EXISTS proxies`);
  await db.raw(`DROP TABLE IF EXISTS profile_extensions`);
  await db.raw(`DROP TABLE IF EXISTS groups`);
  await db.raw(`DROP TABLE IF EXISTS profiles`);
}
