import express from 'express';
import {
    getCurrentRental,
    getBillsSummary,
    getRecentMaintenance,
    getRecentAnnouncements,
    uploadImage,
    submitInquiry
} from '../controllers/tenantController.js';
import fileUpload from 'express-fileupload';

const router = express.Router();

// 添加调试中间件
router.use((req, res, next) => {
    console.log('Tenant Route accessed:', req.method, req.originalUrl);
    next();
});

// 添加文件上传中间件
router.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制为10MB
    useTempFiles: false,
    abortOnLimit: true
}));

// 当前租房信息
router.get('/rental/current', getCurrentRental);

// 账单摘要
router.get('/bills/summary', getBillsSummary);

// 最近的维修请求
router.get('/maintenance/recent', getRecentMaintenance);

// 最近的公告
router.get('/announcements/recent', getRecentAnnouncements);

// 上传图片
router.post('/upload-image', uploadImage);

// 提交咨询
router.post('/inquiry/submit', submitInquiry);

export default router; 