import path from "node:path";
import { nanoid } from "nanoid";
import { config } from "../../config.js";
import { computeCreateFingerprint, computeUpdateFingerprint, stripChromiumManagedFingerprintFields } from "./profiles.service.js";
import { safeJson, setIfPresent } from "../../utils/common.js";

export class ProfilesRepository {
  constructor(databaseManager) {
    this._databaseManager = databaseManager;
  }

  get db() {
    return this._databaseManager.db;
  }

  async load() {
    return this;
  }

  // -------------------------------------------------------------------------
  // Query helpers
  // -------------------------------------------------------------------------

  #applyFilters(query, options) {
    if (options.search) {
      const s = `%${String(options.search).toLowerCase()}%`;
      query.andWhere((b) => b.whereRaw("lower(name) like ?", [s]).orWhereRaw("lower(notes) like ?", [s]).orWhereRaw("lower(tags) like ?", [s]));
    }
    if (options.groupId) {
      if (options.groupId === "uncategorized") {
        query.andWhere((b) => b.whereNull("group_id").orWhere("group_id", ""));
      } else {
        query.andWhere("group_id", options.groupId);
      }
    }
    if (options.status) query.andWhere("status", options.status);
    return query;
  }

  // -------------------------------------------------------------------------
  // Read operations
  // -------------------------------------------------------------------------

  async list(options = {}) {
    const query = this.#applyFilters(this.db("profiles").where({ is_deleted: 0 }), options);
    if (Number.isFinite(Number(options.limit))) query.limit(Number(options.limit));
    if (Number.isFinite(Number(options.offset))) query.offset(Number(options.offset));
    const rows = await query.orderBy("created_at", "desc");
    return rows.map((row) => this.mapRow(row));
  }

  async count(options = {}) {
    const query = this.#applyFilters(this.db("profiles").where({ is_deleted: 0 }), options);
    const row = await query.count({ total: "*" }).first();
    return Number(row?.total || 0);
  }

  async get(id, { includeDeleted = false } = {}) {
    const query = this.db("profiles").where({ id });
    if (!includeDeleted) query.andWhere({ is_deleted: 0 });
    const row = await query.first();
    return row ? this.mapRow(row) : null;
  }

  async listTrash(options = {}) {
    const query = this.db("profiles").where({ is_deleted: 1 });
    if (options.search) {
      const s = `%${String(options.search).toLowerCase()}%`;
      query.andWhere((b) => b.whereRaw("lower(name) like ?", [s]).orWhereRaw("lower(notes) like ?", [s]).orWhereRaw("lower(tags) like ?", [s]));
    }
    const rows = await query.orderBy("updated_at", "desc");
    return rows.map((row) => this.mapRow(row));
  }

  async tags() {
    const rows = await this.db("profiles").select("tags").where({ is_deleted: 0 }).whereNotNull("tags");
    const tags = new Set();
    for (const row of rows) {
      String(row.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => tags.add(item));
    }
    return [...tags].sort();
  }

  // -------------------------------------------------------------------------
  // Write operations
  // -------------------------------------------------------------------------

  async create(input = {}) {
    const id = input.id || `profile_${nanoid(10)}`;
    if (await this.get(id, { includeDeleted: true })) throw new Error(`Profile already exists: ${id}`);

    const now = new Date().toISOString();
    const os = input.os || "linux";
    
    // Call out to service layer for business logic.
    const fingerprint = computeCreateFingerprint({ ...input, os }, config.defaultWidth, config.defaultHeight);
    const botzvnConfigPath = input.botzvnConfigPath || null;

    const row = {
      id,
      name: input.name || id,
      os,
      browser_type: input.browser_type || input.browserType || "botzvn",
      proxy_type: input.proxy_type || input.proxy?.type || null,
      proxy_host: input.proxy_host || input.proxy?.host || null,
      proxy_port: input.proxy_port || input.proxy?.port || null,
      proxy_username: input.proxy_username || input.proxy?.username || null,
      proxy_password: input.proxy_password || input.proxy?.password || null,
      proxy_reset_url: input.proxy_reset_url || null,
      platform_url: input.platform_url || input.url || "",
      platform_tabs: input.platform_tabs || null,
      platform_username: input.platform_username || null,
      platform_password: input.platform_password || null,
      platform_2fa: input.platform_2fa || null,
      fingerprint: JSON.stringify(fingerprint),
      cookies: JSON.stringify(Array.isArray(input.cookies) ? input.cookies : []),
      startup_args: JSON.stringify(input.startup_args || input.launchArgs || []),
      notes: input.notes || "",
      tags: input.tags || "",
      status: "stopped",
      user_agent: input.user_agent || fingerprint.navigator?.userAgent || null,
      is_deleted: 0,
      group_id: input.group_id || null,
      user_data_dir: input.userDataDir || path.join(config.profilesDir, id),
      botzvn_config_path: botzvnConfigPath,
      botzvn_token: input.botzvnToken || null,
      created_at: now,
      updated_at: now,
    };

    await this.db("profiles").insert(row);
    return await this.get(id);
  }

  async update(id, patch = {}) {
    const existing = await this.get(id);
    if (!existing) return null;

    const normalizedPatch = patch;

    // Call out to service layer for business logic
    const nextFingerprint = computeUpdateFingerprint(existing, normalizedPatch, config.defaultWidth, config.defaultHeight);

    const update = { updated_at: new Date().toISOString() };
    setIfPresent(update, "name", normalizedPatch.name);
    setIfPresent(update, "os", normalizedPatch.os);
    setIfPresent(update, "browser_type", normalizedPatch.browser_type || normalizedPatch.browserType);
    setIfPresent(update, "proxy_type", normalizedPatch.proxy_type ?? normalizedPatch.proxy?.type);
    setIfPresent(update, "proxy_host", normalizedPatch.proxy_host ?? normalizedPatch.proxy?.host);
    setIfPresent(update, "proxy_port", normalizedPatch.proxy_port ?? normalizedPatch.proxy?.port);
    setIfPresent(update, "proxy_username", normalizedPatch.proxy_username ?? normalizedPatch.proxy?.username);
    setIfPresent(update, "proxy_password", normalizedPatch.proxy_password ?? normalizedPatch.proxy?.password);
    setIfPresent(update, "proxy_reset_url", normalizedPatch.proxy_reset_url);
    setIfPresent(update, "platform_url", normalizedPatch.platform_url || normalizedPatch.url);
    setIfPresent(update, "platform_tabs", normalizedPatch.platform_tabs);
    setIfPresent(update, "platform_username", normalizedPatch.platform_username);
    setIfPresent(update, "platform_password", normalizedPatch.platform_password);
    setIfPresent(update, "platform_2fa", normalizedPatch.platform_2fa);
    setIfPresent(update, "notes", normalizedPatch.notes);
    setIfPresent(update, "tags", normalizedPatch.tags);
    setIfPresent(update, "group_id", normalizedPatch.group_id);
    setIfPresent(update, "user_agent", normalizedPatch.user_agent || nextFingerprint?.navigator?.userAgent);
    setIfPresent(update, "user_data_dir", normalizedPatch.userDataDir);
    setIfPresent(update, "botzvn_config_path", normalizedPatch.botzvnConfigPath);
    setIfPresent(update, "botzvn_token", normalizedPatch.botzvnToken);

    if (nextFingerprint) update.fingerprint = JSON.stringify(nextFingerprint);
    if (normalizedPatch.cookies) update.cookies = JSON.stringify(normalizedPatch.cookies);
    if (normalizedPatch.startup_args || normalizedPatch.launchArgs) {
      update.startup_args = JSON.stringify(normalizedPatch.startup_args || normalizedPatch.launchArgs);
    }

    await this.db("profiles").where({ id }).update(update);
    return await this.get(id);
  }

  async updateStatus(id, status) {
    await this.db("profiles").where({ id }).update({ status, updated_at: new Date().toISOString() });
  }

  async delete(id) {
    const changes = await this.db("profiles").where({ id, is_deleted: 0 }).update({ is_deleted: 1, status: "stopped", updated_at: new Date().toISOString() });
    return changes > 0;
  }

  async restore(id) {
    const changes = await this.db("profiles").where({ id, is_deleted: 1 }).update({ is_deleted: 0, updated_at: new Date().toISOString() });
    return changes > 0;
  }

  async forceDelete(id) {
    const changes = await this.db("profiles").where({ id }).delete();
    return changes > 0;
  }

  // -------------------------------------------------------------------------
  // Mapping / serialization
  // -------------------------------------------------------------------------

  mapRow(row) {
    const fingerprint = stripChromiumManagedFingerprintFields(safeJson(row.fingerprint, {}));
    const cookies = safeJson(row.cookies, []);
    const launchArgs = safeJson(row.startup_args, []);
    const screen = {
      width: fingerprint.screen?.width || config.defaultWidth,
      height: fingerprint.screen?.height || config.defaultHeight,
    };
    return {
      id: row.id,
      name: row.name,
      os: row.os,
      browser_type: row.browser_type,
      proxy_type: row.proxy_type,
      proxy_host: row.proxy_host,
      proxy_port: row.proxy_port,
      proxy_username: row.proxy_username,
      proxy_password: row.proxy_password,
      proxy_reset_url: row.proxy_reset_url,
      platform_url: row.platform_url,
      platform_tabs: row.platform_tabs,
      platform_username: row.platform_username,
      platform_password: row.platform_password,
      platform_2fa: row.platform_2fa,
      fingerprint,
      cookies,
      startup_args: launchArgs,
      notes: row.notes || "",
      tags: row.tags || "",
      status: row.status,
      user_agent: row.user_agent,
      group_id: row.group_id,
      is_deleted: Boolean(row.is_deleted),
      userDataDir: row.user_data_dir || path.join(config.profilesDir, row.id),
      screen,
      url: row.platform_url || "",
      proxy: row.proxy_host
        ? {
            type: row.proxy_type || "http",
            host: row.proxy_host,
            port: row.proxy_port,
            username: row.proxy_username,
            password: row.proxy_password,
          }
        : null,
      launchArgs,
      botzvnConfigPath: row.botzvn_config_path || null,
      botzvnToken: row.botzvn_token || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
