import express from 'express';
import * as propertiesController from '../controllers/properties.controller.js';
import { verifyToken, isLandlord } from '../middleware/auth.middleware.js';

const router = express.Router();

// 公开路由 - 不需要认证
// GET /api/properties - 获取房源列表（支持筛选）
router.get('/', propertiesController.getProperties);

// GET /api/properties/public/:id - 获取公开房源详情（小程序使用）
router.get('/public/:id', propertiesController.getPublicPropertyById);

// GET /api/properties/:id - 获取单个房源详情
router.get('/:id', propertiesController.getPropertyById);

// 需要认证的路由
// POST /api/properties - 添加新房源（需要房东权限）
router.post('/', verifyToken, isLandlord, propertiesController.createProperty);

// PUT /api/properties/:id - 更新房源信息（需要房东权限）
router.put('/:id', verifyToken, isLandlord, propertiesController.updateProperty);

// DELETE /api/properties/:id - 删除房源（需要房东权限）
router.delete('/:id', verifyToken, isLandlord, propertiesController.deleteProperty);

// PUT /api/properties/:id/status - 更新房源状态（上架/下架）（需要房东权限）
router.put('/:id/status', verifyToken, isLandlord, propertiesController.updatePropertyStatus);

// POST /api/properties/:id/images - 上传房源图片（需要房东权限）
router.post('/:id/images', verifyToken, isLandlord, propertiesController.uploadPropertyImages);

export default router;
