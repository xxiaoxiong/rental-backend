# Rental MiniProgram Backend

后端服务器为租房小程序提供 API 接口。

## 环境要求

- Node.js v16+ (推荐使用最新 LTS 版本)
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
- `/api/ai` - AI 相关功能接口
- `/api/stats` - 数据统计接口

## Vercel 部署

本项目可以部署到 Vercel，步骤如下：

1. 在 GitHub 上创建仓库并推送代码
2. 在 Vercel 上导入仓库
3. 配置必要的环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
4. 部署项目

注意事项：

- 确保根目录下有`vercel.json`文件
- 在 Vercel 控制台中添加所有必要的环境变量
- Vercel 默认会使用`npm start`命令启动项目

## 技术栈

- Express.js - Web 框架
- Supabase - 数据库和身份验证
- JWT - 身份令牌
