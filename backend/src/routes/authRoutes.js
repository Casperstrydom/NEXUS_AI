import express from "express";

import {
  signup,
  login,
  getCurrentUser,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", getCurrentUser);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
