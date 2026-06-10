import { nanoid } from "nanoid";

export class ProxiesRepository {
  constructor(databaseManager) {
    this._databaseManager = databaseManager;
  }

  get db() {
    return this._databaseManager.db;
  }

  async list() {
    const rows = await this.db("proxies").orderBy("created_at", "desc");
    return rows.map((row) => this.mapRow(row));
  }

  async get(id) {
    const row = await this.db("proxies").where({ id }).first();
    return row ? this.mapRow(row) : null;
  }

  async getByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const rows = await this.db("proxies").whereIn("id", ids);
    return rows.map((row) => this.mapRow(row));
  }

  async createMany(proxies) {
    const now = new Date().toISOString();
    const inserted = [];

    for (const p of proxies) {
      const id = `proxy_${nanoid(10)}`;
      const row = {
        id,
        name: p.name || `${p.host}:${p.port}`,
        type: p.type || "http",
        host: p.host,
        port: Number(p.port),
        username: p.username || null,
        password: p.password || null,
        status: p.status || "ACTIVE",
        country_code: p.country_code || null,
        latency: p.latency !== undefined ? p.latency : null,
        created_at: now,
        updated_at: now,
      };
      await this.db("proxies").insert(row);
      inserted.push(this.mapRow(row));
    }

    return inserted;
  }

  async update(id, patch) {
    const update = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.type !== undefined) update.type = patch.type;
    if (patch.host !== undefined) update.host = patch.host;
    if (patch.port !== undefined) update.port = Number(patch.port);
    if (patch.username !== undefined) update.username = patch.username || null;
    if (patch.password !== undefined) update.password = patch.password || null;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.country_code !== undefined) update.country_code = patch.country_code || null;
    if (patch.latency !== undefined) update.latency = patch.latency !== null ? Number(patch.latency) : null;

    const changes = await this.db("proxies").where({ id }).update(update);
    return changes > 0;
  }

  async delete(id) {
    const changes = await this.db("proxies").where({ id }).delete();
    return changes > 0;
  }

  mapRow(row) {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      host: row.host,
      port: Number(row.port),
      username: row.username || undefined,
      password: row.password || undefined,
      status: row.status,
      country_code: row.country_code || undefined,
      latency: row.latency !== null && row.latency !== undefined ? Number(row.latency) : undefined,
      created_at: row.created_at,
    };
  }
}
