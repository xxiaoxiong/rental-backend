import express from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// 通用图片上传接口，需要认证
router.post('/image', verifyToken, uploadController.uploadImage);

export default router; 