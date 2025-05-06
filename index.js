import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./src/routes/auth.routes.js";
import propertiesRoutes from "./src/routes/properties.routes.js";
import inquiriesRoutes from "./src/routes/inquiries.routes.js";
import appointmentsRoutes from "./src/routes/appointments.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";
import homepageRoutes from "./src/routes/homepage.routes.js";
import rentalGuideRoutes from "./src/routes/rentalGuideRoutes.js";
import tenantRoutes from "./src/routes/tenant.routes.js";
import bannersRoutes from "./src/routes/banners.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";

// Get the current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Starting server initialization...");

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制文件大小为10MB
  useTempFiles: false, // 不使用临时文件
  createParentPath: true, // 自动创建上传目录
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/inquiries", inquiriesRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/rental-guides", rentalGuideRoutes);
app.use("/api/tenant", tenantRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/upload", uploadRoutes);

// 测试文件上传的路由 - 不需要任何权限验证
app.post("/api/test-upload", (req, res) => {
  console.log("============ 测试上传接口被调用 ============");
  console.log(`请求头: ${JSON.stringify(req.headers, null, 2)}`);

  if (!req.files || Object.keys(req.files).length === 0) {
    console.log("测试上传接口未接收到文件");
    return res.status(400).json({ success: false, message: "未接收到文件" });
  }

  console.log(`接收到的文件字段: ${JSON.stringify(Object.keys(req.files), null, 2)}`);

  // 构建文件信息
  const fileInfos = {};
  Object.keys(req.files).forEach(fieldName => {
    const files = req.files[fieldName];
    if (Array.isArray(files)) {
      fileInfos[fieldName] = files.map(f => ({
        name: f.name,
        size: f.size,
        mimetype: f.mimetype
      }));
    } else {
      fileInfos[fieldName] = {
        name: files.name,
        size: files.size,
        mimetype: files.mimetype
      };
    }
  });

  console.log(`文件详情: ${JSON.stringify(fileInfos, null, 2)}`);
  console.log("============ 测试上传接口结束 ============");

  return res.status(200).json({
    success: true,
    message: "文件上传测试成功",
    fileInfos
  });
});

// Root endpoint for health check
app.get("/", (req, res) => {
  console.log("Health check endpoint accessed");
  res.status(200).json({ message: "Rental MiniProgram Backend is running!" });
});

// Global error handler (basic)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "服务器内部错误" });
});

// Start the server
const PORT = process.env.PORT || 3000;
console.log(`Setting up server on port ${PORT}...`);

// Always start the server regardless of module status
console.log("Starting server...");
try {
  const server = app.listen(PORT, () => {
    console.log(`Server successfully running on port ${PORT}`);
    console.log(`Server address: http://localhost:${PORT}`);
    console.log(`Try accessing the health check endpoint at: http://localhost:${PORT}/`);
    // Check if Supabase client initialized correctly
    import("./src/supabaseClient.js");
  });

  // Add error handling for server
  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please try another port.`);
    }
  });
} catch (error) {
  console.error("Failed to start server:", error);
}

// Export the app for testing purposes
export default app;
