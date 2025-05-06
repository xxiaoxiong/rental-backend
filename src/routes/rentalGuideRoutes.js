import express from 'express';
import {
    getRentalProcess,
    getRentalTips,
    getRentalFAQ
} from '../controllers/rentalGuideController.js';

const router = express.Router();

// 添加调试中间件
router.use((req, res, next) => {
    console.log('Rental Guide Route accessed:', req.method, req.originalUrl);
    next();
});

// 获取租房流程
router.get('/process', (req, res, next) => {
    console.log('Process endpoint accessed');
    getRentalProcess(req, res, next);
});

// 获取注意事项
router.get('/tips', (req, res, next) => {
    console.log('Tips endpoint accessed');
    getRentalTips(req, res, next);
});

// 获取常见问题
router.get('/faq', (req, res, next) => {
    console.log('FAQ endpoint accessed');
    getRentalFAQ(req, res, next);
});

export default router; 