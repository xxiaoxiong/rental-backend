import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ success: false, message: "需要提供认证令牌" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, 'r6t+1iDFciGLH6u2h1N2mJqimAVzPOgMxc+FEdDtjbYpbu6vwA6bI00qNKvDT2d66tS8Yp/P+7r0qR+V2ds2hA==');
    req.user = decoded; // 将解码后的用户信息附加到请求对象
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ success: false, message: "无效或过期的令牌" });
  }
};

export const isLandlord = (req, res, next) => {
  if (req.user && req.user.role === "landlord") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "需要房东权限" });
  }
};

// 管理员权限检查中间件
export const isAdmin = (req, res, next) => {
  try {
    // 检查用户是否通过了身份验证
    if (!req.user) {
      return res.status(401).json({ success: false, message: "未授权" });
    }

    // 检查用户是否具有管理员角色
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "需要管理员权限" });
    }

    // 如果用户是管理员，继续执行
    next();
  } catch (error) {
    console.error("Admin权限检查错误:", error);
    return res.status(500).json({ success: false, message: "权限验证失败" });
  }
};
