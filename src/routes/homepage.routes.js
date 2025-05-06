import express from 'express';
import * as homepageController from '../controllers/homepage.controller.js';

const router = express.Router();

// GET /api/homepage - Get homepage data for the miniprogram
router.get('/', homepageController.getHomepageData);

export default router; 