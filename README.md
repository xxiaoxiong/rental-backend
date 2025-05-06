# Rental MiniProgram Backend

后端服务器为租房小程序提供API接口。

## 环境要求

- Node.js v16+ (推荐使用最新LTS版本)
- npm 或 yarn

## 安装与启动

1. 安装依赖:
```
npm install
```

2. 创建环境变量文件(.env):
```
PORT=3000
SUPABASE_URL=你的Supabase项目URL
SUPABASE_KEY=你的Supabase项目API密钥
JWT_SECRET=用于签名JWT的密钥，可以是任意复杂字符串
```

3. 启动服务器:
```
npm start
```
或
```
node index.js
```

服务器将在 http://localhost:3000 上运行。

## API 路由

- `/api/auth` - 身份认证相关接口
- `/api/properties` - 房产/房源管理接口
- `/api/inquiries` - 咨询/询盘管理接口
- `/api/appointments` - 预约看房接口
- `/api/ai` - AI相关功能接口
- `/api/stats` - 数据统计接口

## 技术栈

- Express.js - Web框架
- Supabase - 数据库和身份验证
- JWT - 身份令牌 