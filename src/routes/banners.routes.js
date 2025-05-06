import express from 'express';
import * as bannersController from '../controllers/banners.controller.js';
import { verifyToken, isAdmin, isLandlord } from '../middleware/auth.middleware.js';

const router = express.Router();

// 公开路由 - 获取轮播图列表
router.get('/', bannersController.getBanners);

// 需要权限的路由 - 房东或管理员都可以操作
// 创建轮播图
router.post('/', verifyToken, bannersController.createBanner);

// 重新排序轮播图 - 注意：这个路由必须在/:id路由之前定义，否则会被/:id匹配
router.post('/reorder', verifyToken, bannersController.reorderBanners);

// 更新轮播图 - 支持两种方式
router.put('/:id', verifyToken, bannersController.updateBanner);
// 添加一个POST路由用于更新，以便支持请求体中包含ID的情况
router.post('/update', verifyToken, bannersController.updateBanner);

// 删除轮播图 - 支持两种方式 
router.delete('/:id', verifyToken, bannersController.deleteBanner);
// 添加一个POST路由用于删除，以便支持请求体中包含ID的情况
router.post('/delete', verifyToken, bannersController.deleteBanner);

export default router; 