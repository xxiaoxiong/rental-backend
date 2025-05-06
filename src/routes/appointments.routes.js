import express from "express";
import * as appointmentsController from "../controllers/appointments.controller.js";
import { verifyToken, isLandlord } from "../middleware/auth.middleware.js";

const router = express.Router();

// 公开路由 - 不需要认证
// POST /api/appointments - 创建预约 (无需认证，用于小程序表单提交)
router.post("/", appointmentsController.createPublicAppointment);

// POST /api/appointments/public - 创建新预约 (无需认证，用于小程序)
router.post("/public", appointmentsController.createPublicAppointment);

// 为了兼容误拼，添加一个相同的路由
router.post("/appointmentsmessage", appointmentsController.createPublicAppointment);

// 需要认证的路由
// 以下路由都需要认证
// GET /api/appointments - 获取预约列表 (租客获取自己的，房东获取相关的)
router.get("/", verifyToken, appointmentsController.getAppointments);

// GET /api/appointments/:id - 获取单个预约详情 (需要租客或相关房东认证)
router.get("/:id", verifyToken, appointmentsController.getAppointmentById);

// PUT /api/appointments/:id/status - 更新预约状态 (需要房东认证)
router.put("/:id/status", verifyToken, isLandlord, appointmentsController.updateAppointmentStatus);

export default router;
