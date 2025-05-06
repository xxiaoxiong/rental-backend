import { supabase } from "../src/supabaseClient.js";

async function testHomepageAPI() {
    console.log("====== 测试首页接口轮播图数据获取 ======");

    try {
        // 测试轮播图查询
        console.log("1. 使用原始查询获取轮播图:");
        const { data: bannerList1, error: bannerError1 } = await supabase
            .from("banners")
            .select("*")
            .order("order", { ascending: true });

        if (bannerError1) {
            console.error("查询失败:", bannerError1);
        } else {
            console.log(`获取到 ${bannerList1?.length || 0} 个轮播图`);
            console.log("数据:", JSON.stringify(bannerList1, null, 2));
        }

        // 格式化数据
        const formattedBanners = bannerList1?.map(banner => ({
            image: banner.image,
            title: banner.title,
            link: banner.link
        })) || [];

        console.log("格式化后的轮播图数据:", JSON.stringify(formattedBanners, null, 2));

        // 测试查询更多信息
        console.log("\n2. 获取更多数据库表信息:");
        const { data: tables } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        console.log("数据库表:", tables?.map(t => t.table_name));

        // 测试轮播图表结构
        console.log("\n3. 检查轮播图表结构:");
        const { data: columns } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_schema', 'public')
            .eq('table_name', 'banners');

        console.log("轮播图表结构:", columns);

        console.log("====== 测试完成 ======");
    } catch (error) {
        console.error("测试过程中出现异常:", error);
    }
}

// 执行测试
testHomepageAPI(); 