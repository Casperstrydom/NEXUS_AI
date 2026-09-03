import express from "express";

import {
  createMessage,
  createStreamingMessage,
  getMessages,
} from "../controllers/messageController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:id/messages", createMessage);

router.post("/:id/messages/stream", createStreamingMessage);

router.get("/:id/messages", getMessages);

export default router;
