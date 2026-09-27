import { Router } from "express";
import { index, show } from "@/modules/auth/controllers/role.controller.js";

const router = Router();

router.get("/role", index);
router.get("/role/:id", show);

export default router;
