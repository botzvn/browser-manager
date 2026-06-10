import path from "node:path";
import knex from "knex";
import { config } from "./config.js";
import { ensureDir, pathExists, readJson, writeJsonAtomic } from "./utils/fs.js";

const SETUP_VERSION = 1;

export class DatabaseManager {
  constructor() {
    this.db = null;
    this.setup = null;
  }

  async init() {
    await ensureDir(config.dataDir);
    this.setup = await this.resolveSetup();
    if (!this.setup) return this;
    await this.connect(this.setup);
    return this;
  }

  async connect(setup) {
    if (setup.client === "sqlite") {
      await ensureDir(path.dirname(setup.filename));
    }

    if (this.db) await this.db.destroy();
    this.setup = setup;
    this.db = knex(this.knexConfig(setup));
    await this.db.raw("SELECT 1");
    await this.migrate();
    await this.db("profiles").where({ status: "running" }).update({ status: "stopped" });
    return this.db;
  }

  async resolveSetup() {
    if (config.databaseUrl) {
      return {
        version: SETUP_VERSION,
        source: "env",
        client: "postgres",
        connection: config.databaseUrl,
      };
    }

    if (config.databaseClient === "postgres") {
      throw new Error("BOTZVN_DATABASE_CLIENT=postgres requires BOTZVN_DATABASE_URL");
    }

    if (await pathExists(config.databaseSetupFile)) {
      const setup = await readJson(config.databaseSetupFile, null);
      return this.normalizeSetup(setup, "file");
    }

    return null;
  }

  normalizeSetup(input, source = "file") {
    if (!input || typeof input !== "object") throw new Error("Invalid database setup file");
    if (input.client === "postgres") {
      if (!input.connection) throw new Error("PostgreSQL setup requires connection");
      return {
        version: input.version || SETUP_VERSION,
        source,
        client: "postgres",
        connection: input.connection,
      };
    }
    if (input.client === "sqlite") {
      return {
        version: input.version || SETUP_VERSION,
        source,
        client: "sqlite",
        filename: input.filename || config.sqliteFile,
      };
    }
    throw new Error(`Unsupported database client: ${input.client}`);
  }

  knexConfig(setup) {
    if (setup.client === "postgres") {
      return {
        client: "pg",
        connection: setup.connection,
        pool: { min: 0, max: 10 },
      };
    }
    return {
      client: "better-sqlite3",
      connection: { filename: setup.filename },
      useNullAsDefault: true,
      pool: { min: 1, max: 1 },
    };
  }

  async configure(input) {
    if (input.client === "auto") {
      input = { client: "sqlite", filename: config.sqliteFile };
    }
    const setup = this.normalizeSetup({ version: SETUP_VERSION, ...input }, "file");
    await this.testConnection(setup);
    await ensureDir(path.dirname(config.databaseSetupFile));
    await writeJsonAtomic(config.databaseSetupFile, setup);
    await this.connect(setup);
    return {
      ok: true,
      restartRequired: false,
      setup: this.publicSetup(setup),
    };
  }

  publicSetup(setup = this.setup) {
    if (!setup) {
      return {
        configured: false,
        required: true,
        recommended: {
          client: "auto",
          label: "Auto setup",
          description: "Use SQLite in the manager data volume. No external service required.",
          sqliteFile: config.sqliteFile,
        },
        options: ["auto", "sqlite", "postgres"],
      };
    }
    if (setup.client === "postgres") {
      return {
        configured: true,
        source: setup.source,
        client: "postgres",
        connection: maskConnection(setup.connection),
      };
    }
    return {
      configured: true,
      source: setup.source,
      client: "sqlite",
      filename: setup.filename,
    };
  }

  async testConnection(setup) {
    if (setup.client === "sqlite") {
      await ensureDir(path.dirname(setup.filename));
    }
    const testDb = knex(this.knexConfig(setup));
    try {
      await testDb.raw("SELECT 1");
    } finally {
      await testDb.destroy();
    }
  }

  async migrate() {
    await this.db.migrate.latest({
      directory: new URL('./db/migrations', import.meta.url).pathname,
      tableName: 'knex_migrations',
    });
  }

  async destroy() {
    if (this.db) await this.db.destroy();
  }
}

function maskConnection(value = "") {
  return value.replace(/:\/\/([^:@]+):([^@]+)@/, "://$1:***@");
}

export const databaseManager = new DatabaseManager();
