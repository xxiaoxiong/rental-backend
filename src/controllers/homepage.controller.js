import { supabase } from "../supabaseClient.js";

/**
 * GET /api/homepage - Get homepage data for the miniprogram
 * 返回小程序首页所需的全部数据：轮播图、热门房源、热门攻略
 */
export const getHomepageData = async (req, res) => {
  try {
    console.log("====== 开始获取首页数据 ======");

    // 1. 获取轮播图数据
    console.log("正在获取轮播图数据...");
    const { data: bannerList, error: bannerError } = await supabase
      .from("banners")
      .select("*")
      .order("order", { ascending: true });
    console.log(bannerList);

    if (bannerError) {
      console.error("轮播图数据获取失败:", bannerError);
      // 继续执行，不要因为轮播图获取失败而中断
    } else {
      console.log(`成功获取到${bannerList?.length || 0}个轮播图`);
      if (bannerList && bannerList.length > 0) {
        console.log("轮播图数据示例:", JSON.stringify(bannerList[0], null, 2));
      }
    }

    // 2. 获取热门房源
    const { data: hotProperties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, title, district, price_per_month, images")
      .eq("is_published", true)
      .eq("status", "available")
      .order("view_count", { ascending: false })
      .limit(6);

    if (propertiesError) {
      console.error("Hot properties fetch error:", propertiesError);
      // 继续执行
    }

    // 3. 获取热门攻略
    const { data: topicList, error: topicsError } = await supabase
      .from("topics")
      .select("id, title, author, likes, cover_image")
      .eq("is_published", true)
      .order("likes", { ascending: false })
      .limit(4);

    if (topicsError) {
      console.error("Topics fetch error:", topicsError);
      // 继续执行
    }

    // 4. 格式化返回数据
    const formattedBanners = bannerList?.map(banner => ({
      image: banner.image,
      title: banner.title,
      link: banner.link
    })) || [];

    console.log(`已格式化${formattedBanners.length}个轮播图数据`);
    if (formattedBanners.length > 0) {
      console.log("格式化后的轮播图示例:", JSON.stringify(formattedBanners[0], null, 2));
    }

    const formattedProperties = hotProperties?.map(property => ({
      id: property.id,
      name: property.title,
      location: property.district,
      price: property.price_per_month,
      image: property.images?.[0] || "",
      tag: property.tag || "热门" // 可选标签，默认为"热门"
    })) || [];

    const formattedTopics = topicList?.map(topic => ({
      title: topic.title,
      author: topic.author,
      likes: topic.likes,
      image: topic.cover_image
    })) || [];

    // 5. 返回完整的首页数据
    console.log("====== 首页数据获取完成 ======");
    return res.status(200).json({
      success: true,
      data: {
        bannerList: formattedBanners,
        hotProperties: formattedProperties,
        topicList: formattedTopics
      }
    });
  } catch (error) {
    console.error("首页数据获取异常:", error);
    return res.status(500).json({
      success: false,
      message: "获取首页数据失败"
    });
  }
}; 