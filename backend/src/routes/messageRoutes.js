import express from "express";

import {
  createMessage,
  getMessages,
} from "../controllers/messageController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:id/messages", createMessage);

router.get("/:id/messages", getMessages);

export default router;
