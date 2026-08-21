import express from "express";

import {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
} from "../controllers/conversationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createConversation);

router.get("/", getConversations);

router.get("/:id", getConversation);

router.delete("/:id", deleteConversation);

export default router;
