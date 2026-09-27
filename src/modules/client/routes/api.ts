import { Router } from "express";
import fileUpload from "express-fileupload";
import { authenticate } from "@/middlewares/auth.js";
import {
	destroy,
	index,
	listCities,
	show,
	store,
	update,
} from "@/modules/client/controllers/client.controller.js";
import { MAX_IMAGE_SIZE } from "@/modules/client/controllers/client.helpers.js";

const router = Router();

const uploadMiddleware = fileUpload({
	createParentPath: true,
	limits: {
		fileSize: MAX_IMAGE_SIZE,
	},
	abortOnLimit: false,
});

router.get("/cities", authenticate, listCities);
router.get("/", authenticate, index);
router.get("/:id", authenticate, show);
router.post("/", authenticate, uploadMiddleware, store);
router.put("/:id", authenticate, uploadMiddleware, update);
router.delete("/:id", authenticate, destroy);

export default router;
