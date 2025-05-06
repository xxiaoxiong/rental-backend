import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// GET /api/auth/test-direct - 直接测试Supabase连接
router.get('/test-direct', async (req, res) => {
  try {
    
    // 测试1: 尝试获取所有用户
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    
    if (usersError) {
      console.error("用户表查询错误:", usersError);
    }
    
    // 测试2: 尝试获取表结构信息
    const { data: tablesInfo, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log("表结构信息:", tablesInfo);
    
    // 测试3: 查询是否存在auth.users表（Supabase默认的用户表）
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(1);
    
    console.log("auth.users查询结果:", authUsers);
    
    // 返回结果
    return res.json({
      success: true,
      users: users || [],
      usersError: usersError || null,
      tables: tablesInfo || [],
      tablesError: tablesError || null,
      authUsers: authUsers || [],
      authError: authError || null
    });
  } catch (error) {
    console.error("直接测试查询错误:", error);
    return res.status(500).json({ 
      success: false, 
      message: "测试查询失败",
      error: error.message
    });
  }
});

// GET /api/auth/test-db - 测试数据库连接
router.get('/test-db', authController.testDatabaseConnection);

// POST /api/auth/login/password - Landlord login with password
router.post('/login/password', authController.loginLandlordPassword);

// POST /api/auth/register/landlord - Register new landlord
router.post('/register/landlord', authController.registerLandlord);

// POST /api/auth/login/wechat - Tenant/User login with WeChat code (placeholder)
router.post('/login/wechat', authController.loginWechat);

// POST /api/auth/register - 通用用户注册接口
router.post('/register', authController.registerUser);

export default router;

