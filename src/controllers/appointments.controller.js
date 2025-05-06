import { supabase } from "../supabaseClient.js";

/**
 * POST /api/appointments/public - Create a new viewing appointment without authentication
 * 为小程序等客户端提供的预约接口，不需要登录
 */
export const createPublicAppointment = async (req, res) => {
  try {
    console.log("接收到预约请求:", req.body);

    // 从请求体中获取前端表单字段
    const {
      property_id,
      appointment_time,  // 直接使用前端传来的appointment_time
      phone_number,      // 对应contact_phone
      notes
    } = req.body;

    // 验证必填字段
    if (!property_id) {
      return res.status(400).json({
        success: false,
        message: "房源ID是必填项"
      });
    }

    if (!appointment_time) {
      return res.status(400).json({
        success: false,
        message: "预约时间是必填项"
      });
    }

    // 获取property_id对应的landlord_id
    let landlord_id = null;

    if (property_id) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("landlord_id")
        .eq("id", property_id)
        .single();

      if (!propertyError && property) {
        landlord_id = property.landlord_id;
      } else {
        console.error("找不到对应的房源:", propertyError);
        return res.status(404).json({
          success: false,
          message: "找不到对应的房源"
        });
      }
    }

    // 查找或创建默认租客ID
    let guestTenantId = null;

    // 首先尝试查找一个用户ID
    const { data: defaultUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (!userError && defaultUser && defaultUser.length > 0) {
      guestTenantId = defaultUser[0].id;
      console.log("找到用户ID:", guestTenantId);
    } else {
      console.error("找不到任何用户:", userError);
      return res.status(500).json({
        success: false,
        message: "系统错误：找不到可用的用户ID"
      });
    }

    // 根据数据库实际字段构建预约数据
    const appointmentData = {
      tenant_id: guestTenantId,
      property_id: property_id,
      landlord_id: landlord_id,
      appointment_time: appointment_time,  // 直接使用前端传来的appointment_time
      status: 'pending'
    };

    // 添加租客备注
    let tenantNotes = '';
    if (phone_number) tenantNotes += `联系电话: ${phone_number}\n`;
    if (notes) tenantNotes += `备注: ${notes}`;

    if (tenantNotes) {
      appointmentData.tenant_notes = tenantNotes;
    }

    console.log("准备插入预约数据:", appointmentData);

    // 插入预约记录
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select();

    if (appointmentError) {
      console.error("创建预约失败，数据库错误:", appointmentError);
      return res.status(500).json({
        success: false,
        message: "创建预约失败",
        error: appointmentError
      });
    }

    console.log("预约创建成功:", appointment);
    return res.status(201).json({
      success: true,
      message: "预约已创建，等待房东确认",
      appointment: appointment[0],
    });
  } catch (error) {
    console.error("创建预约时发生错误:", error);
    return res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.toString()
    });
  }
};

/**
 * POST /api/appointments - Create a new viewing appointment
 */
export const createAppointment = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { property_id, viewing_date, viewing_time, notes } = req.body;

    // 移除必填项的验证，接受所有请求
    /*
    if (!property_id || !preferred_date) {
      return res.status(400).json({ success: false, message: "房源ID和参观日期是必填项" });
    }
    */

    let landlord_id = null;
    let property_title = null;

    // Get property details to get landlord_id
    if (property_id) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("landlord_id, title")
        .eq("id", property_id)
        .single();

      if (!propertyError && property) {
        landlord_id = property.landlord_id;
        property_title = property.title;
      }
    }

    // 创建预约数据
    const appointmentData = {
      tenant_id: tenantId,
      landlord_id: landlord_id,
      property_id: property_id || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 根据表结构添加字段
    if (viewing_date) appointmentData.viewing_date = viewing_date;
    if (viewing_time) appointmentData.viewing_time = viewing_time;
    if (notes) appointmentData.notes = notes;

    // Create the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select();

    if (appointmentError) {
      console.error("Database error:", appointmentError);
      return res.status(500).json({ success: false, message: "创建预约失败" });
    }

    return res.status(201).json({
      success: true,
      message: "预约已创建，等待房东确认",
      appointment: appointment[0],
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/appointments - Get appointments (tenants get their own, landlords get related)
 */
export const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const status = req.query.status; // Optional filter

    let query = supabase.from("appointments").select("*");

    // Filter based on user role
    if (userRole === "tenant") {
      query = query.eq("tenant_id", userId);
    } else if (userRole === "landlord") {
      query = query.eq("landlord_id", userId);
    } else {
      return res.status(403).json({ success: false, message: "无权访问" });
    }

    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Add sorting
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取预约列表失败" });
    }

    return res.status(200).json({ success: true, appointments: data });
  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/appointments/:id - Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "预约未找到" });
      }
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取预约详情失败" });
    }

    // Check permissions - only the tenant who made the appointment or the landlord can view it
    if (
      (userRole === "tenant" && data.tenant_id !== userId) &&
      (userRole === "landlord" && data.landlord_id !== userId)
    ) {
      return res.status(403).json({ success: false, message: "无权查看此预约" });
    }

    return res.status(200).json({ success: true, appointment: data });
  } catch (error) {
    console.error("Get appointment by ID error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * PUT /api/appointments/:id/status - Update appointment status (landlord only)
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { status, scheduled_time, landlord_notes } = req.body;

    if (!status || !["confirmed", "rejected", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "无效的状态值" });
    }

    // Verify appointment exists and belongs to this landlord
    const { data: appointment, error: findError } = await supabase
      .from("appointments")
      .select("id, landlord_id")
      .eq("id", id)
      .single();

    if (findError || !appointment) {
      return res.status(404).json({ success: false, message: "预约未找到" });
    }

    if (appointment.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权修改此预约" });
    }

    // Update the appointment
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    // 添加确认时间和房东备注
    if (landlord_notes) updateData.landlord_notes = landlord_notes;
    if (status === "confirmed" && scheduled_time) updateData.scheduled_time = scheduled_time;

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "更新预约状态失败" });
    }

    return res.status(200).json({
      success: true,
      message: "预约状态已更新",
      appointment: data[0],
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};
