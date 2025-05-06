import { supabase } from "../supabaseClient.js";

/**
 * GET /api/stats/overview - Get overview statistics for a landlord
 */
export const getOverviewStats = async (req, res) => {
  try {
    const landlordId = req.user.id;
    console.log(req.user.id);
    
    // Get all properties for this landlord
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, status, created_at, view_count")
      .eq("landlord_id", landlordId);
    console.log(properties);
    
    if (propertiesError) {
      console.error("Database error:", propertiesError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    // 获取这个房东所有房源的ID列表
    const propertyIds = properties.map(p => p.id);
    
    // 通过property_id获取所有相关inquiries
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("id, property_id, created_at")
      .in("property_id", propertyIds);
    
    console.log("Inquiries:", inquiries);
    console.log("Inquiries Error:", inquiriesError);
    
    if (inquiriesError) {
      console.error("Database error:", inquiriesError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    // Get all appointments for this landlord's properties
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, property_id, status, created_at")
      .in("property_id", propertyIds);
    
    console.log("Appointments:", appointments);
    console.log("Appointments Error:", appointmentsError);
    
    if (appointmentsError) {
      console.error("Database error:", appointmentsError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total_properties: properties.length,
      available_properties: properties.filter(p => p.status === "available").length,
      total_views: properties.reduce((sum, p) => sum + (p.view_count || 0), 0),
      total_inquiries: inquiries.length,
      total_appointments: appointments.length,
      pending_appointments: appointments.filter(a => a.status === "pending").length,
      upcoming_appointments: appointments.filter(a => {
        const scheduledDate = new Date(a.created_at);
        return scheduledDate > now && a.status === "confirmed";
      }).length,
      recent_inquiries: inquiries.filter(i => new Date(i.created_at) > thirtyDaysAgo).length,
      recent_appointments: appointments.filter(a => new Date(a.created_at) > thirtyDaysAgo).length,
    };
    
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/stats/properties/:id - Get statistics for a specific property
 */
export const getPropertyStats = async (req, res) => {
  try {
    console.log(req);
    debugger
    
    const { id } = req.params;
    const landlordId = req.user.id;
    
    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, landlord_id, title, created_at, view_count, status")
      .eq("id", id)
      .single();
    
    if (propertyError) {
      if (propertyError.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "房源未找到" });
      }
      console.error("Database error:", propertyError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    if (property.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权查看此房源统计数据" });
    }
    
    // Get inquiries for this property
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("id, created_at")
      .eq("property_id", id);
    
    if (inquiriesError) {
      console.error("Database error:", inquiriesError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    // Get appointments for this property
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, status, created_at")
      .eq("property_id", id);
    
    if (appointmentsError) {
      console.error("Database error:", appointmentsError);
      return res.status(500).json({ success: false, message: "获取统计数据失败" });
    }
    
    // Calculate statistics
    const now = new Date();
    const createdDate = new Date(property.created_at);
    const daysListed = Math.floor((now - createdDate) / (24 * 60 * 60 * 1000));
    
    const propertyStats = {
      property_id: property.id,
      property_title: property.title,
      status: property.status,
      days_listed: daysListed,
      total_views: property.view_count || 0,
      views_per_day: daysListed > 0 ? (property.view_count || 0) / daysListed : 0,
      total_inquiries: inquiries.length,
      total_appointments: appointments.length,
      conversion_rate: {
        views_to_inquiries: property.view_count > 0 ? inquiries.length / property.view_count : 0,
        inquiries_to_appointments: inquiries.length > 0 ? appointments.length / inquiries.length : 0,
      },
      appointments_by_status: {
        pending: appointments.filter(a => a.status === "pending").length,
        confirmed: appointments.filter(a => a.status === "confirmed").length,
        completed: appointments.filter(a => a.status === "completed").length,
        cancelled: appointments.filter(a => a.status === "cancelled").length,
      }
    };
    
    return res.status(200).json({ success: true, stats: propertyStats });
  } catch (error) {
    console.error("Property stats error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};
