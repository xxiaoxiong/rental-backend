import express from "express";
import * as inquiriesController from "../controllers/inquiries.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /api/inquiries - 创建新咨询 (AI Chat接口已包含此逻辑，此接口可选)
// router.post("/", verifyToken, inquiriesController.createInquiry);

// GET /api/inquiries - 获取咨询列表 (房东获取所有，租客获取自己的)
router.get("/", verifyToken, inquiriesController.getInquiries);

// GET /api/inquiries/:id - 获取单个咨询详情 (需要租客或相关房东认证)
router.get("/:id", verifyToken, inquiriesController.getInquiryById);

export default router;
