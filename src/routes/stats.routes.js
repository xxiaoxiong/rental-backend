import express from "express";
import * as statsController from "../controllers/stats.controller.js";
import { verifyToken, isLandlord } from "../middleware/auth.middleware.js";

const router = express.Router();

// 所有统计路由都需要房东权限
router.use(verifyToken, isLandlord);

// GET /api/stats/overview - 获取总体统计数据
router.get("/overview", statsController.getOverviewStats);

// GET /api/stats/properties/:id - 获取单个房源的统计数据
router.get("/properties/:id", statsController.getPropertyStats);

export default router;
