import { supabase } from "../supabaseClient.js";

// Helper function to parse query parameters for pagination and filtering
const parseQueryOptions = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const filters = {};
  if (query.district) filters.district = query.district;
  if (query.min_price) filters.min_price = parseFloat(query.min_price);
  if (query.max_price) filters.max_price = parseFloat(query.max_price);
  if (query.bedrooms) filters.bedrooms = parseInt(query.bedrooms);
  if (query.property_type) filters.property_type = query.property_type;
  if (query.landlord_id) filters.landlord_id = query.landlord_id; // For landlord specific queries

  return { page, limit, from, to, filters };
};

/**
 * GET /api/properties - Get list of properties (public, filterable)
 */
export const getProperties = async (req, res) => {
  try {
    const { from, to, filters } = parseQueryOptions(req.query);

    let query = supabase
      .from("properties")
      .select("*", { count: "exact" })
      // .eq("is_published", true) // Only show published properties publicly
      .order("created_at", { ascending: false })
      .range(from, to);

    // Apply filters
    if (filters.district) query = query.eq("district", filters.district);
    if (filters.bedrooms) query = query.eq("bedrooms", filters.bedrooms);
    if (filters.property_type) query = query.eq("property_type", filters.property_type);
    if (filters.min_price) query = query.gte("price_per_month", filters.min_price);
    if (filters.max_price) query = query.lte("price_per_month", filters.max_price);
    // Add landlord filter if provided (used internally for landlord management)
    if (filters.landlord_id) query = query.eq("landlord_id", filters.landlord_id);

    const { data, error, count } = await query;
    console.log(data);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取房源列表失败" });
    }

    return res.status(200).json({ success: true, total: count, properties: data });
  } catch (error) {
    console.error("Get properties error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/properties/:id - Get single property detail (public)
 */
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      // .eq("is_published", true) // Consider if unpublished should be accessible by ID
      .single();

    if (error) {
      if (error.code === "PGRST116") { // PostgREST error code for no rows found
        return res.status(404).json({ success: false, message: "房源未找到" });
      }
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "获取房源详情失败" });
    }

    // 返回成功响应
    res.status(200).json({ success: true, property: data });

    // 异步更新浏览次数，不阻塞响应
    process.nextTick(async () => {
      try {
        await supabase.rpc("increment_view_count", { property_id: id });
        console.log(`房源 ${id} 浏览次数更新成功`);
      } catch (viewCountError) {
        console.error(`更新房源 ${id} 浏览次数失败:`, viewCountError);
      }
    });

  } catch (error) {
    console.error("Get property by ID error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * GET /api/properties/public/:id - Get property detail for public viewing
 * 为小程序等客户端提供的公开房源详情接口
 */
export const getPublicPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`尝试获取房源ID: ${id}的详情`);

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error(`无效的房源ID格式: ${id}`);
      return res.status(400).json({ success: false, message: "无效的房源ID格式" });
    }

    // 从数据库获取房源详情
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    // 错误处理
    if (error) {
      console.error(`获取房源详情失败，房源ID: ${id}, 错误:`, error);
      if (error.code === "PGRST116") { // PostgREST error code for no rows found
        return res.status(404).json({ success: false, message: "房源未找到" });
      }
      return res.status(500).json({ success: false, message: "获取房源详情失败", error: error.message });
    }

    // 额外的空值检查
    if (!data) {
      console.error(`未找到房源，ID: ${id}`);
      return res.status(404).json({ success: false, message: "房源未找到" });
    }

    console.log(`成功获取房源ID: ${id}的详情`);

    // 返回成功响应
    res.status(200).json({ success: true, property: data });

    // 异步更新浏览次数，不阻塞响应
    process.nextTick(async () => {
      try {
        await supabase.rpc("increment_view_count", { property_id: id });
        console.log(`房源 ${id} 浏览次数更新成功`);
      } catch (viewCountError) {
        console.error(`更新房源 ${id} 浏览次数失败:`, viewCountError);
      }
    });

  } catch (error) {
    console.error(`获取公开房源详情时发生错误，错误信息:`, error);
    return res.status(500).json({ success: false, message: "服务器错误", error: error.message });
  }
};

/**
 * POST /api/properties - Create a new property (landlord only)
 */
export const createProperty = async (req, res) => {
  try {
    const landlordId = req.user.id; // From auth middleware
    const { title, description, address, city, district, price_per_month, area_sqm, bedrooms, bathrooms, property_type, amenities, images } = req.body;

    // Basic validation
    if (!title || !price_per_month) {
      return res.status(400).json({ success: false, message: "标题和价格是必填项" });
    }

    const { data, error } = await supabase
      .from("properties")
      .insert([
        {
          landlord_id: landlordId,
          title,
          description,
          address,
          city,
          district,
          price_per_month,
          area_sqm,
          bedrooms,
          bathrooms,
          property_type,
          amenities,
          images, // Assuming images are URLs from a separate upload step or pre-signed URLs
          status: "available", // Default status
          is_published: false, // Default to unpublished
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "创建房源失败" });
    }

    return res.status(201).json({ success: true, property: data[0] });
  } catch (error) {
    console.error("Create property error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * PUT /api/properties/:id - Update a property (landlord only)
 */
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { title, description, address, city, district, price_per_month, area_sqm, bedrooms, bathrooms, property_type, amenities, images, status, is_published } = req.body;

    // Verify ownership
    const { data: existingProperty, error: findError } = await supabase
      .from("properties")
      .select("id, landlord_id")
      .eq("id", id)
      .single();

    if (findError || !existingProperty) {
      return res.status(404).json({ success: false, message: "房源未找到" });
    }

    if (existingProperty.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权修改此房源" });
    }

    // Prepare update data (only include fields provided in the request)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (price_per_month !== undefined) updateData.price_per_month = price_per_month;
    if (area_sqm !== undefined) updateData.area_sqm = area_sqm;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms;
    if (property_type !== undefined) updateData.property_type = property_type;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (images !== undefined) updateData.images = images;
    if (status !== undefined) updateData.status = status;
    if (is_published !== undefined) updateData.is_published = is_published;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length <= 1) { // Only updated_at
      return res.status(400).json({ success: false, message: "没有提供要更新的数据" });
    }

    const { data, error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "更新房源失败" });
    }

    return res.status(200).json({ success: true, property: data[0] });
  } catch (error) {
    console.error("Update property error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * DELETE /api/properties/:id - Delete a property (landlord only)
 */
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    // Verify ownership before deleting
    const { data: existingProperty, error: findError } = await supabase
      .from("properties")
      .select("id, landlord_id")
      .eq("id", id)
      .single();

    if (findError || !existingProperty) {
      return res.status(404).json({ success: false, message: "房源未找到" });
    }

    if (existingProperty.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权删除此房源" });
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "删除房源失败" });
    }

    return res.status(200).json({ success: true, message: "房源删除成功" });
  } catch (error) {
    console.error("Delete property error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * PUT /api/properties/:id/status - Update property status (publish/unpublish) (landlord only)
 */
export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { is_published, status } = req.body;

    // Verify ownership
    const { data: existingProperty, error: findError } = await supabase
      .from("properties")
      .select("id, landlord_id")
      .eq("id", id)
      .single();

    if (findError || !existingProperty) {
      return res.status(404).json({ success: false, message: "房源未找到" });
    }

    if (existingProperty.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权修改此房源状态" });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (is_published !== undefined) {
      updateData.is_published = is_published;
    }
    if (status !== undefined) {
      // Add validation for allowed statuses if needed
      updateData.status = status;
    }

    if (Object.keys(updateData).length <= 1) {
      return res.status(400).json({ success: false, message: "未提供要更新的状态" });
    }

    const { data, error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", id)
      .select("id, is_published, status");

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ success: false, message: "更新房源状态失败" });
    }

    return res.status(200).json({ success: true, message: "状态更新成功", property: data[0] });
  } catch (error) {
    console.error("Update property status error:", error);
    return res.status(500).json({ success: false, message: "服务器错误" });
  }
};

/**
 * POST /api/properties/:id/images - Upload property images (landlord only)
 */
export const uploadPropertyImages = async (req, res) => {
  // 添加详细的调试日志
  console.log("================ 图片上传请求开始 ================");
  console.log(`收到图片上传请求，房源ID: ${req.params.id}`);
  console.log(`请求方法: ${req.method}`);
  console.log(`请求路径: ${req.originalUrl}`);
  console.log(`请求头: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`用户信息: ${req.user ? JSON.stringify(req.user, null, 2) : '未获取到用户信息'}`);

  // 检查文件对象
  console.log(`req.files 类型: ${typeof req.files}`);
  if (req.files) {
    console.log(`req.files 内容: ${JSON.stringify(Object.keys(req.files), null, 2)}`);
    // 如果有images字段，输出更多详情
    if (req.files.images) {
      const imageInfo = Array.isArray(req.files.images)
        ? req.files.images.map(f => ({ name: f.name, size: f.size, mimetype: f.mimetype }))
        : { name: req.files.images.name, size: req.files.images.size, mimetype: req.files.images.mimetype };
      console.log(`上传的图片信息: ${JSON.stringify(imageInfo, null, 2)}`);
    } else {
      console.log(`req.files中没有images字段，所有字段: ${JSON.stringify(Object.keys(req.files), null, 2)}`);
    }
  } else {
    console.log("未检测到上传的文件 (req.files 为空)");
  }

  // 检查请求体
  console.log(`req.body: ${JSON.stringify(req.body, null, 2)}`);
  console.log("================ 图片上传请求日志结束 ================");

  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    // 检查房源是否存在且属于当前用户
    const { data: existingProperty, error: findError } = await supabase
      .from("properties")
      .select("id, landlord_id, images")
      .eq("id", id)
      .single();

    if (findError || !existingProperty) {
      return res.status(404).json({ success: false, message: "房源未找到" });
    }

    if (existingProperty.landlord_id !== landlordId) {
      return res.status(403).json({ success: false, message: "无权为此房源上传图片" });
    }

    // 检查是否有文件上传
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: "未上传任何文件" });
    }

    // 处理上传文件，可能是单个文件或数组
    const uploadedFiles = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];

    // 检查文件类型，只允许图片
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (const file of uploadedFiles) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `不支持的文件类型: ${file.mimetype}，仅支持 JPEG, PNG, GIF 和 WebP`
        });
      }
    }

    // 上传文件到Supabase存储
    const uploadPromises = uploadedFiles.map(async (file) => {
      try {
        // 生成一个唯一的文件名
        const timestamp = Date.now();
        const fileName = `${id}/${timestamp}-${file.name.replace(/\s+/g, '_')}`;

        // 上传到Supabase Storage
        const { data, error } = await supabase.storage
          .from('property-images') // 存储桶名称，需要在Supabase控制台创建
          .upload(fileName, file.data, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (error) {
          console.error('Supabase存储上传错误:', error);

          // 检查是否是存储桶不存在的错误
          if (error.message === 'Bucket not found' || error.error === 'Bucket not found') {
            throw new Error('Supabase存储桶"property-images"不存在，请在Supabase控制台创建此存储桶');
          }

          throw error;
        }

        // 获取公共URL
        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        throw error;
      }
    });

    // 等待所有上传完成
    const imageUrls = await Promise.all(uploadPromises).catch(error => {
      console.error('文件上传过程中出错:', error);

      // 添加更具体的错误信息
      if (error.message && error.message.includes('存储桶')) {
        throw new Error(`Supabase存储配置错误: ${error.message}`);
      }

      throw error;
    });

    // 更新房源记录中的图片URL数组
    const currentImages = existingProperty.images || [];
    const updatedImages = [...currentImages, ...imageUrls];

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        images: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error('更新房源图片记录错误:', updateError);
      return res.status(500).json({ success: false, message: "上传成功但更新房源记录失败" });
    }

    return res.status(200).json({
      success: true,
      message: "图片上传成功",
      image_urls: imageUrls
    });
  } catch (error) {
    console.error("图片上传错误:", error);

    // 提供更具体的错误消息
    let errorMessage = "服务器错误，图片上传失败";

    // 检查是否是存储桶相关的错误
    if (error.message && (error.message.includes('bucket') || error.message.includes('存储桶'))) {
      errorMessage = `存储配置错误: ${error.message}`;
    }
    // 检查是否是权限相关错误
    else if (error.message && (error.message.includes('permission') || error.message.includes('Unauthorized'))) {
      errorMessage = `存储权限错误: 请在Supabase控制台中为"property-images"存储桶配置正确的访问策略，允许认证用户上传文件`;
    }
    // 检查是否是RLS策略错误
    else if (error.message && error.message.includes('row-level security policy')) {
      errorMessage = `Supabase RLS策略错误: 请在Supabase控制台中为"property-images"存储桶添加适当的RLS策略，允许用户上传文件`;
    }

    return res.status(500).json({ success: false, message: errorMessage });
  }
};
