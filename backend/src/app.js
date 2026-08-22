import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
app.set("trust proxy", 1);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/*
  ========================================
  CORS
  ========================================
*/

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

/*
  ========================================
  BODY PARSING
  ========================================
*/

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/*
  ========================================
  SESSION
  ========================================
*/

app.use(
  session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,

      collectionName: "sessions",

      ttl: 60 * 60 * 24 * 7,
    }),

    cookie: {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

/*
  ========================================
  ROUTES
  ========================================
*/

app.use("/api/auth", authRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/conversations", messageRoutes);

/*
  ========================================
  ROOT
  ========================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NexusAI backend is running",
  });
});

/*
  ========================================
  HEALTH CHECK
  ========================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "NexusAI API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

export default app;
