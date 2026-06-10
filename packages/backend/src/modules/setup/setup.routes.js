import { Router } from "express";
import { databaseManager } from "../../database.js";
import { runtimeManager, profilesRepository } from "../../context.js";
import { asyncHandler } from "../../utils/http.js";
import { config } from "../../config.js";

const router = Router();

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const profilesTotal = databaseManager.db && profilesRepository ? await profilesRepository.count() : 0;
    res.json({
      ok: true,
      runningCount: runtimeManager.running.size,
      profilesTotal,
      botzvnPath: config.botzvnPath,
      database: databaseManager.publicSetup(),
    });
  }),
);

router.get("/setup/status", (req, res) => {
  res.json({
    ok: true,
    database: databaseManager.publicSetup(),
  });
});

router.post(
  "/setup/configure",
  asyncHandler(async (req, res) => {
    const result = await databaseManager.configure(req.body || {});
    res.json(result);
  }),
);

export default router;
