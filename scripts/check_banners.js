import { supabase } from "../src/supabaseClient.js";

async function checkBannersTable() {
    console.log("开始检查banners表...");

    try {
        // 查询banners表的所有记录
        const { data, error } = await supabase
            .from("banners")
            .select("*");

        if (error) {
            console.error("查询banners表失败:", error);
            return;
        }

        // 输出结果
        console.log(`banners表中有 ${data.length} 条记录`);
        console.log("表数据:", JSON.stringify(data, null, 2));

        // 检查表结构
        if (data.length > 0) {
            console.log("表结构:", Object.keys(data[0]));
        } else {
            console.log("表中没有数据，无法获取结构");
        }
    } catch (error) {
        console.error("操作过程中出现异常:", error);
    }
}

// 执行检查
checkBannersTable(); 