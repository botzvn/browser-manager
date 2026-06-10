import { databaseManager } from "../database.js";

export function requireDatabase(req, res, next) {
  if (!databaseManager.db) {
    return res.status(503).json({
      error: "Database is not configured",
      database: databaseManager.publicSetup(),
    });
  }
  return next();
}
