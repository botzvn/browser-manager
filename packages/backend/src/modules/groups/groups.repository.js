import { nanoid } from "nanoid";

export class GroupsRepository {
  constructor(databaseManager) {
    this._databaseManager = databaseManager;
  }

  get db() {
    return this._databaseManager.db;
  }

  async list() {
    const groups = await this.db("groups")
      .where({ is_deleted: 0 })
      .orderBy("created_at", "desc");

    // Fetch profile counts for each group
    const counts = await this.db("profiles")
      .select("group_id")
      .count({ count: "*" })
      .where({ is_deleted: 0 })
      .whereNotNull("group_id")
      .groupBy("group_id");

    const countsMap = counts.reduce((acc, row) => {
      acc[row.group_id] = Number(row.count || 0);
      return acc;
    }, {});

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description || "",
      color: g.color || "#64748b",
      profile_count: countsMap[g.id] || 0,
      created_at: g.created_at,
    }));
  }

  async getUncategorizedCount() {
    const row = await this.db("profiles")
      .count({ count: "*" })
      .where({ is_deleted: 0 })
      .andWhere((b) => b.whereNull("group_id").orWhere("group_id", ""))
      .first();
    const countVal = row?.count ?? row?.["count(*)"] ?? 0;
    return Number(countVal);
  }

  async create(input) {
    const id = `group_${nanoid(10)}`;
    const now = new Date().toISOString();
    const row = {
      id,
      name: input.name,
      description: input.description || "",
      color: input.color || "#64748b",
      is_deleted: 0,
      created_at: now,
      updated_at: now,
    };
    await this.db("groups").insert(row);
    return {
      ...row,
      profile_count: 0,
    };
  }

  async update(id, input) {
    const update = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) update.name = input.name;
    if (input.description !== undefined) update.description = input.description;
    if (input.color !== undefined) update.color = input.color;

    const changes = await this.db("groups").where({ id, is_deleted: 0 }).update(update);
    return changes > 0;
  }

  async delete(id) {
    const changes = await this.db("groups").where({ id, is_deleted: 0 }).update({
      is_deleted: 1,
      updated_at: new Date().toISOString(),
    });
    if (changes > 0) {
      // Set group_id to null for profiles in this group
      await this.db("profiles").where({ group_id: id }).update({
        group_id: null,
        updated_at: new Date().toISOString(),
      });
    }
    return changes > 0;
  }
}
