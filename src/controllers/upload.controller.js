import { supabase } from "../supabaseClient.js";

/**
 * 通用图片上传接口
 * POST /api/upload/image
 */
export const uploadImage = async (req, res) => {
    try {
        // 检查是否有文件上传
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: "未上传任何文件" });
        }

        // 获取上传的文件（可能是单个文件或文件数组）
        const uploadedFile = req.files.file || req.files.image;
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                message: "请使用'file'或'image'作为表单字段名"
            });
        }

        // 处理单个文件或文件数组
        const files = Array.isArray(uploadedFile) ? uploadedFile : [uploadedFile];

        // 检查文件类型，只允许图片
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        for (const file of files) {
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: `不支持的文件类型: ${file.mimetype}，仅支持 JPEG, PNG, GIF 和 WebP`
                });
            }
        }

        // 上传文件到Supabase存储
        const uploadPromises = files.map(async (file) => {
            try {
                // 生成唯一的文件名
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 10);
                const fileName = `banners/${timestamp}-${randomStr}-${file.name.replace(/\s+/g, '_')}`;

                // 上传到Supabase Storage
                const { data, error } = await supabase.storage
                    .from('public-images') // 存储桶名称，需要在Supabase控制台创建
                    .upload(fileName, file.data, {
                        contentType: file.mimetype,
                        cacheControl: '3600'
                    });

                if (error) {
                    console.error('Supabase存储上传错误:', error);

                    // 检查是否是存储桶不存在的错误
                    if (error.message === 'Bucket not found' || error.error === 'Bucket not found') {
                        throw new Error('Supabase存储桶"public-images"不存在，请在Supabase控制台创建此存储桶');
                    }

                    // 检查是否是RLS策略错误
                    if (error.message && error.message.includes('row-level security policy')) {
                        throw new Error('Supabase RLS策略错误: 请在Supabase控制台为"public-images"存储桶添加适当的访问策略');
                    }

                    throw error;
                }

                // 获取公共URL
                const { data: urlData } = supabase.storage
                    .from('public-images')
                    .getPublicUrl(fileName);

                return urlData.publicUrl;
            } catch (error) {
                console.error(`上传文件 ${file.name} 失败:`, error);
                throw error;
            }
        });

        // 等待所有上传完成
        const imageUrls = await Promise.all(uploadPromises);

        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: "图片上传成功",
            url: imageUrls[0], // 兼容单文件上传
            image: imageUrls[0], // 兼容使用image字段的旧代码
            image_url: imageUrls[0], // 兼容使用image_url字段的数据库
            image_urls: imageUrls // 兼容多文件上传
        });
    } catch (error) {
        console.error("图片上传错误:", error);

        // 提供更具体的错误消息
        let errorMessage = "服务器错误，图片上传失败";

        if (error.message) {
            if (error.message.includes('bucket') || error.message.includes('存储桶')) {
                errorMessage = `存储配置错误: ${error.message}`;
            } else if (error.message.includes('permission') || error.message.includes('Unauthorized')) {
                errorMessage = `存储权限错误: ${error.message}`;
            } else if (error.message.includes('row-level security policy')) {
                errorMessage = `Supabase RLS策略错误: ${error.message}`;
            } else {
                errorMessage = error.message;
            }
        }

        return res.status(500).json({ success: false, message: errorMessage });
    }
}; 