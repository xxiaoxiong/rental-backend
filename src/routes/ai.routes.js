import express from "express";
import * as aiController from "../controllers/ai.controller.js";
// import { verifyToken } from "../middleware/auth.middleware.js"; // Optional: Decide if AI chat needs auth

const router = express.Router();

// POST /api/ai/chat - Send question to AI and get response
// Consider if authentication is needed. If so, add verifyToken
router.post("/chat", aiController.handleChat);

export default router;
