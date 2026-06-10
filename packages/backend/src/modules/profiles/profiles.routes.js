import { Router } from "express";
import { profilesRepository, runtimeManager } from "../../context.js";
import { asyncHandler } from "../../utils/http.js";
import { getWebglConfigs } from "./profiles.service.js";

const router = Router();

router.get(
  "/webgl-options",
  asyncHandler(async (req, res) => {
    const platform = req.query.platform || "windows";
    let options = [];
    if (platform === "macos") {
      options = [...getWebglConfigs("mac_apple_silicon"), ...getWebglConfigs("mac")];
    } else if (platform === "linux") {
      options = getWebglConfigs("linux");
    } else {
      options = getWebglConfigs("windows");
    }

    res.json({ options, tier: "premium", totalCount: options.length });
  }),
);

function enrichProfile(profile) {
  return {
    ...profile,
    runtime: runtimeManager.publicRuntime(runtimeManager.get(profile.id)),
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = clampNumber(req.query.limit, 1, 500, 100);
    const page = clampNumber(req.query.page, 1, 100000, 1);
    const offset = (page - 1) * limit;
    const filters = {
      search: req.query.search,
      status: req.query.status,
      groupId: req.query.group_id,
      limit,
      offset,
    };
    const [profiles, total] = await Promise.all([profilesRepository.list(filters), profilesRepository.count(filters)]);
    res.json({
      profiles: profiles.map((profile) => enrichProfile(profile)),
      total,
      limit,
      offset,
      success: true,
      data: profiles.map((profile) => enrichProfile(profile)),
      pagination: { total, page, limit },
    });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const profile = await profilesRepository.create(req.body || {});
    res.status(201).json(enrichProfile(profile));
  }),
);

router.get(
  "/tags",
  asyncHandler(async (req, res) => {
    res.json(await profilesRepository.tags());
  }),
);

router.get(
  "/trash",
  asyncHandler(async (req, res) => {
    const profiles = await profilesRepository.listTrash({ search: req.query.search });
    res.json({ profiles, total: profiles.length, success: true, data: profiles });
  }),
);

router.post(
  "/:id/restore",
  asyncHandler(async (req, res) => {
    const restored = await profilesRepository.restore(req.params.id);
    if (!restored) return res.status(404).json({ error: "Profile not found" });
    return res.json({ ok: true });
  }),
);

router.delete(
  "/:id/force",
  asyncHandler(async (req, res) => {
    if (runtimeManager.get(req.params.id)) await runtimeManager.stop(req.params.id);
    const deleted = await profilesRepository.forceDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    return res.json({ ok: true });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await profilesRepository.get(req.params.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(enrichProfile(profile));
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await profilesRepository.update(req.params.id, req.body || {});
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(enrichProfile(profile));
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (runtimeManager.get(req.params.id)) await runtimeManager.stop(req.params.id);
    const deleted = await profilesRepository.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    return res.json({ ok: true });
  }),
);

router.post(
  "/:id/start",
  asyncHandler(async (req, res) => {
    const profile = await profilesRepository.get(req.params.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    const runtime = await runtimeManager.start(profile);
    await profilesRepository.updateStatus(req.params.id, "running");
    return res.json(runtime);
  }),
);

router.post(
  "/:id/stop",
  asyncHandler(async (req, res) => {
    const result = await runtimeManager.stop(req.params.id);
    await profilesRepository.updateStatus(req.params.id, "stopped");
    return res.json(result);
  }),
);

router.get(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const profile = await profilesRepository.get(req.params.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(runtimeManager.publicRuntime(runtimeManager.get(req.params.id)));
  }),
);

router.post(
  "/:id/view/start",
  asyncHandler(async (req, res) => {
    const viewer = await runtimeManager.startViewer(req.params.id);
    res.json({ ...viewer, wsPath: `/api/profiles/${req.params.id}/vnc` });
  }),
);

router.post(
  "/:id/view/stop",
  asyncHandler(async (req, res) => {
    res.json(await runtimeManager.stopViewer(req.params.id));
  }),
);

router.get("/:id/view/status", (req, res) => {
  const runtime = runtimeManager.get(req.params.id);
  res.json(runtimeManager.publicRuntime(runtime).viewer || { active: false });
});

export default router;
