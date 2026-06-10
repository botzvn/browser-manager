import { Router } from "express";
import { groupsRepository } from "../../context.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const groups = await groupsRepository.list();
    const uncategorized = await groupsRepository.getUncategorizedCount();
    res.json({ groups, uncategorized });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.body.name) {
      return res.status(400).json({ error: "Group name is required" });
    }
    const group = await groupsRepository.create(req.body);
    res.status(201).json(group);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const success = await groupsRepository.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ success: true });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const success = await groupsRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ success: true });
  })
);

export default router;
