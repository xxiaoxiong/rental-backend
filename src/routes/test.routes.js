import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// 测试轮播图接口
router.get("/banners", async (req, res) => {
    try {
        console.log("测试获取轮播图数据...");

        // 查询轮播图数据
        const { data, error } = await supabase
            .from("banners")
            .select("*")
            .order("order", { ascending: true });

        if (error) {
            console.error("查询失败:", error);
            return res.status(500).json({ success: false, error });
        }

        console.log(`获取到 ${data?.length || 0} 条轮播图数据`);
        console.log("示例数据:", data && data.length > 0 ? JSON.stringify(data[0]) : "无数据");

        // 格式化返回数据
        const formattedData = data?.map(banner => ({
            id: banner.id,
            title: banner.title,
            image: banner.image,
            link: banner.link,
            order: banner.order
        })) || [];

        return res.status(200).json({
            success: true,
            count: formattedData.length,
            data: formattedData
        });
    } catch (error) {
        console.error("测试接口异常:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router; 