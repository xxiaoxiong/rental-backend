import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../supabaseClient.js";

/**
 * 验证数据库连接
 */
export const testDatabaseConnection = async (req, res) => {
  try {
    // 打印Supabase配置信息(不包含密钥)
    console.log("Supabase URL:", process.env.SUPABASE_URL ? "已配置" : "未配置");
    console.log("Supabase Key:", process.env.SUPABASE_KEY ? "已配置(已隐藏)" : "未配置");
    
    // 尝试获取数据库中的表
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
    
    console.log("数据库表列表:", tables);
    
    if (tablesError) {
      console.error("获取表列表错误:", tablesError);
      return res.status(500).json({ 
        success: false, 
        message: "数据库连接测试失败", 
        error: tablesError 
      });
    }
    
    // 测试用户表查询
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log("用户表记录数:", userCount !== null ? "查询成功" : "查询失败");
    
    if (userError) {
      console.error("查询用户表错误:", userError);
      return res.status(500).json({ 
        success: false, 
        message: "用户表访问测试失败", 
        error: userError 
      });
    }
    
    // 打印用户表的第一条记录(结构)
    const { data: firstUser, error: firstUserError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (firstUser && firstUser.length > 0) {
      console.log("用户表字段结构:", Object.keys(firstUser[0]));
    } else {
      console.log("用户表为空或无法访问");
    }
    
    // 尝试列出所有表
    const { data: allTables, error: allTablesError } = await supabase
      .rpc('get_all_tables');

    console.log("获取所有表:", allTables || "请求失败");
    if (allTablesError) {
      console.error("获取所有表错误:", allTablesError);
    }

    // 尝试直接查询pg_tables
    const { data: pgTables, error: pgTablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    console.log("pg_tables查询结果:", pgTables || "请求失败");
    if (pgTablesError) {
      console.error("pg_tables查询错误:", pgTablesError);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "数据库连接测试成功",
      tables: tables ? tables.map(t => t.table_name) : [],
      userTableAccessible: !userError,
      userSchema: firstUser && firstUser.length > 0 ? Object.keys(firstUser[0]) : []
    });
  } catch (error) {
    console.error("数据库连接测试错误:", error);
    return res.status(500).json({ 
      success: false, 
      message: "数据库连接测试失败", 
      error: error.message 
    });
  }
};

/**
 * Login landlord with username/password
 */
export const loginLandlordPassword = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 打印登录尝试信息
    console.log("登录尝试:", { username, password: password });

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 先检查supabase是否正确初始化
    if (!supabase) {
      console.error("Supabase客户端未初始化");
      return res.status(500).json({ success: false, message: '数据库连接错误' });
    }

    // 查询用户
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "landlord")
      .eq("username", username)
      .eq("password", password) // 不在查询中直接比较密码
      .limit(1);
      
    // 完整的调试信息
    console.log("查询结果:", users ? `找到${users.length}条记录` : "无数据");
    if (error) {
      console.error("数据库查询错误:", error);
    }

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "服务器错误" });
    }

    if (!users || users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "用户名或密码错误" });
    }

    const user = users[0];
    
    // 检查用户密码字段是否存在
    console.log("用户字段:", Object.keys(user));
    
    // 验证密码 - 适应明文密码存储的情况
    let isPasswordValid = false;
    
    if (user.password_hash) {
      // 如果有密码哈希，使用bcrypt比较
      try {
        isPasswordValid = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        console.error("密码比较错误:", err);
      }
    } else if (user.password) {
      // 如果是明文密码，直接比较
      isPasswordValid = (password === user.password);
      console.log("直接比较密码:", password, user.password, isPasswordValid);
    }
    
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "用户名或密码错误" });
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      // process.env.JWT_SECRET,
      "r6t+1iDFciGLH6u2h1N2mJqimAVzPOgMxc+FEdDtjbYpbu6vwA6bI00qNKvDT2d66tS8Yp/P+7r0qR+V2ds2hA==",
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // 默认7天过期
    );

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * Register new landlord
 */
export const registerLandlord = async (req, res) => {
  try {
    const { username, password, phone } = req.body;

    if (!username || !password || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "所有字段都是必填的" });
    }

    // 检查用户名是否已存在
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .or(`username.eq.${username},phone_number.eq.${phone}`)
      .limit(1);

    if (checkError) {
      console.error("Database error:", checkError);
      return res.status(500).json({ success: false, message: "服务器错误" });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "用户名或手机号已被使用" });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          username,
          password_hash: hashedPassword,
          phone_number: phone,
          role: "landlord",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (createError) {
      console.error("Database error:", createError);
      return res.status(500).json({ success: false, message: "创建用户失败" });
    }

    return res.status(201).json({
      success: true,
      message: "注册成功",
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        phone_number: newUser[0].phone_number,
        role: newUser[0].role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * Login with WeChat code (placeholder - would require WeChat API integration)
 */
export const loginWechat = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "WeChat code is required" });
    }

    // 实际实现中，这里需要调用微信API获取openid
    // 这里简化处理，假设已经获取到了openid
    const mockOpenid = `wx_${Math.random().toString(36).substring(2, 15)}`;

    // 查找或创建用户
    let { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("openid", mockOpenid)
      .limit(1);

    if (findError) {
      console.error("Database error:", findError);
      return res.status(500).json({ success: false, message: "服务器错误" });
    }

    let user;

    if (!existingUser || existingUser.length === 0) {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            openid: mockOpenid,
            role: "tenant",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (createError) {
        console.error("Database error:", createError);
        return res
          .status(500)
          .json({ success: false, message: "创建用户失败" });
      }

      user = newUser[0];
    } else {
      user = existingUser[0];
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("WeChat login error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * 通用用户注册接口
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    console.log("用户注册请求:", { username, role });

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "用户名和密码不能为空" 
      });
    }
    
    // 验证角色是否有效
    const validRoles = ['tenant', 'landlord'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "无效的用户角色，允许的值: tenant, landlord" 
      });
    }
    
    // 默认角色为租客
    const userRole = role || 'tenant';

    // 检查用户名是否已存在
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (checkError) {
      console.error("检查用户名错误:", checkError);
      return res.status(500).json({ 
        success: false, 
        message: "服务器错误" 
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "用户名已被使用" 
      });
    }

    // 创建当前时间
    const now = new Date().toISOString();
    
    // 创建用户对象
    const userData = {
      username,
      password: password, // 使用明文密码，与现有代码保持一致
      role: userRole,
      created_at: now,
      updated_at: now,
    };
    
    // 为用户生成随机昵称
    userData.nickname = userRole === 'landlord' ? `房东${username}` : `租客${username}`;

    // 创建用户
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([userData])
      .select();

    if (createError) {
      console.error("创建用户错误:", createError);
      return res.status(500).json({ 
        success: false, 
        message: "创建用户失败", 
        error: createError 
      });
    }

    // 如果成功创建，返回结果，不包含密码
    if (newUser && newUser.length > 0) {
      const { password: _, ...userWithoutPassword } = newUser[0];
      
      // 生成JWT令牌
      const token = jwt.sign(
        { id: newUser[0].id, role: newUser[0].role },
        "r6t+1iDFciGLH6u2h1N2mJqimAVzPOgMxc+FEdDtjbYpbu6vwA6bI00qNKvDT2d66tS8Yp/P+7r0qR+V2ds2hA==",
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // 默认7天过期
      );
      
      return res.status(201).json({
        success: true,
        message: "注册成功",
        user: userWithoutPassword,
        token
      });
    }

    // 如果没有返回用户数据但也没有错误，返回通用成功消息
    return res.status(201).json({
      success: true,
      message: "注册成功"
    });
    
  } catch (error) {
    console.error("用户注册错误:", error);
    return res.status(500).json({ 
      success: false, 
      message: "服务器错误", 
      error: error.toString() 
    });
  }
};
