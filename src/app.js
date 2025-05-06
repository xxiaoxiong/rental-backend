import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";

import properties from "./routes/properties.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import tenantRoutes from "./routes/tenant.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import homepage from "./routes/homepage.routes.js";
import testRoutes from "./routes/test.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 中间件
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 文件上传中间件
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    abortOnLimit: true,
    responseOnLimit: "文件大小超过限制",
}));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 注册路由
app.use("/api/properties", properties);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/homepage", homepage);
app.use("/api/test", testRoutes);

// 其他路由处理
app.get('/', (req, res) => {
    res.send('租房小程序后端API正在运行');
});

app.use((req, res) => {
    res.status(404).json({ message: "路由未找到" });
});

export default app; 