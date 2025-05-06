import { supabase } from "../supabaseClient.js";

/**
 * GET /api/inquiries - Get inquiries (landlord gets all, tenant gets own)
 */
export const getInquiries = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = supabase.from("inquiries").select("*");

    // Filter based on user role
    if (userRole === "tenant") {
      // Tenants can only see their own inquiries
      query = query.eq("tenant_id", userId);
    } else if (userRole === "landlord") {
      // 房东需要查看与他们的房产相关的咨询
      // 首先获取房东的所有房产
      const { data: properties } = await supabase
        .from("properties")
        .select("id")
        .eq("landlord_id", userId);
      
      if (properties && properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        // 然后通过房产ID查询相关咨询
        query = query.in("property_id", propertyIds);
      } else {
        // 如果房东没有房产，返回空数组
        return res.status(200).json({ success: true, inquiries: [] });
      }
    }

    // Add sorting and pagination if needed
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取咨询列表失败" });
    }

    return res.status(200).json({ success: true, inquiries: data });
  } catch (error) {
    console.error("Get inquiries error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/inquiries/:id - Get inquiry by ID (tenant who created it or related landlord)
 */
export const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data, error } = await supabase
      .from("inquiries")
      .select("*, properties(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "咨询未找到" });
      }
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取咨询详情失败" });
    }

    // Verify user has permission to view this inquiry
    if (
      (userRole === "tenant" && data.tenant_id !== userId) &&
      (userRole === "landlord" && data.properties && data.properties.landlord_id !== userId)
    ) {
      return res.status(403).json({ success: false, message: "无权查看此咨询" });
    }

    return res.status(200).json({ success: true, inquiry: data });
  } catch (error) {
    console.error("Get inquiry by ID error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};
