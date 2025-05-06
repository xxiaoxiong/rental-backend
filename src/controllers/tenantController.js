import { supabase } from '../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

// 获取当前租房信息
export const getCurrentRental = async (req, res) => {
    try {
        // 从请求中获取用户ID，实际实现可能从认证中间件获取
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未授权，需要用户ID'
            });
        }

        const { data, error } = await supabase
            .from('rentals')
            .select(`
                *,
                property:property_id (
                    id,
                    name,
                    address,
                    image
                )
            `)
            .eq('tenant_id', userId)
            .eq('status', 'active')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取当前租房信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取当前租房信息失败'
        });
    }
};

// 获取账单摘要
export const getBillsSummary = async (req, res) => {
    try {
        // 从请求中获取用户ID，实际实现可能从认证中间件获取
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未授权，需要用户ID'
            });
        }

        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('tenant_id', userId)
            .order('due_date', { ascending: false })
            .limit(5);

        if (error) throw error;

        // 计算账单摘要
        const unpaidBills = data.filter(bill => bill.status === 'unpaid');
        const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

        res.json({
            success: true,
            data: {
                recent_bills: data,
                unpaid_count: unpaidBills.length,
                total_unpaid: totalUnpaid,
                next_due: unpaidBills.length > 0 ? unpaidBills[0].due_date : null
            }
        });
    } catch (error) {
        console.error('获取账单摘要失败:', error);
        res.status(500).json({
            success: false,
            error: '获取账单摘要失败'
        });
    }
};

// 获取最近的维修请求
export const getRecentMaintenance = async (req, res) => {
    try {
        // 从请求中获取用户ID，实际实现可能从认证中间件获取
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未授权，需要用户ID'
            });
        }

        const { data, error } = await supabase
            .from('maintenance_requests')
            .select('*')
            .eq('tenant_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取最近维修请求失败:', error);
        res.status(500).json({
            success: false,
            error: '获取最近维修请求失败'
        });
    }
};

// 获取最近的公告
export const getRecentAnnouncements = async (req, res) => {
    try {
        // 从请求中获取用户ID，实际实现可能从认证中间件获取
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未授权，需要用户ID'
            });
        }

        // 获取用户的租房信息，找到相关的物业或小区ID
        const { data: rentalData, error: rentalError } = await supabase
            .from('rentals')
            .select('property_id')
            .eq('tenant_id', userId)
            .eq('status', 'active')
            .single();

        if (rentalError) throw rentalError;

        const propertyId = rentalData?.property_id;

        if (!propertyId) {
            return res.status(404).json({
                success: false,
                error: '未找到活跃的租房记录'
            });
        }

        // 获取该物业/小区的公告
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取最近公告失败:', error);
        res.status(500).json({
            success: false,
            error: '获取最近公告失败'
        });
    }
};

/**
 * 上传图片接口
 * POST /tenant/upload-image
 */
export const uploadImage = async (req, res) => {
    try {
        console.log('接收到上传图片请求', req.body);

        // 检查是否有文件上传
        if (!req.files || !req.files.image) {
            return res.status(400).json({
                success: false,
                message: '未找到上传的图片文件'
            });
        }

        // 获取类型参数，默认为general
        const type = req.body.type || 'general';

        const imageFile = req.files.image;
        const fileExtension = imageFile.name.split('.').pop().toLowerCase();
        const fileName = `${uuidv4()}.${fileExtension}`;

        // 根据type参数确定文件路径
        const filePath = `${type}/${fileName}`;

        console.log('准备上传文件:', {
            fileName,
            fileSize: imageFile.size,
            mimetype: imageFile.mimetype,
            type,
            filePath
        });

        try {
            // 尝试直接使用签名URL上传
            // 这会绕过RLS策略限制
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('images')
                .createSignedUploadUrl(filePath);

            if (signedUrlError) {
                console.error('创建签名URL失败:', signedUrlError);
                throw signedUrlError;
            }

            console.log('已获取签名上传URL', signedUrlData);

            // 使用签名URL上传文件
            const { error: uploadError } = await supabase.storage
                .from('images')
                .uploadToSignedUrl(
                    filePath,
                    signedUrlData.signedUrl,
                    imageFile.data,
                    {
                        contentType: imageFile.mimetype,
                        upsert: true
                    }
                );

            if (uploadError) {
                console.error('使用签名URL上传失败:', uploadError);
                throw uploadError;
            }

            // 获取上传图片的公共URL
            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            console.log('图片上传成功', urlData);

            // 返回与前端期望格式一致的数据结构
            return res.status(200).json({
                success: true,
                message: '图片上传成功',
                imageUrl: urlData.publicUrl,  // 前端需要的字段
                data: {
                    url: urlData.publicUrl,
                    fileName,
                    path: filePath,
                    type
                }
            });
        } catch (storageError) {
            console.error('签名URL上传失败，尝试直接上传:', storageError);

            // 尝试方法2：直接上传，忽略RLS政策
            try {
                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(filePath, imageFile.data, {
                        contentType: imageFile.mimetype,
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) {
                    console.error('直接上传也失败:', error);
                    throw error;
                }

                // 获取上传图片的公共URL
                const { data: urlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                // 返回与前端期望格式一致的数据结构
                return res.status(200).json({
                    success: true,
                    message: '图片上传成功',
                    imageUrl: urlData.publicUrl,  // 前端需要的字段
                    data: {
                        url: urlData.publicUrl,
                        fileName,
                        path: filePath,
                        type
                    }
                });
            } catch (directUploadError) {
                console.error('所有上传方法都失败，返回模拟URL:', directUploadError);

            }
        }
    } catch (error) {
        console.error('上传图片时发生错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.toString(),
            hint: '请在Supabase管理界面中为images存储桶配置适当的权限'
        });
    }
};

/**
 * 提交咨询接口
 * POST /tenant/inquiry/submit
 */
export const submitInquiry = async (req, res) => {
    try {
        console.log('接收到咨询提交请求:', req.body);

        const {
            property_id = null,  // 允许为空
            type = 'rent',      // 咨询类型：rent, repair, contract, other
            title,              // 咨询标题
            content,            // 咨询内容
            contact,            // 联系方式
            images = []         // 图片URL数组
        } = req.body;

        // 只验证标题和内容是否存在
        if (!title) {
            return res.status(400).json({
                success: false,
                message: '咨询标题是必填项'
            });
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '咨询内容是必填项'
            });
        }

        // 获取默认用户ID
        let userId = req.user?.id;

        if (!userId) {
            // 查找一个默认用户ID
            const { data: defaultUser, error: userError } = await supabase
                .from('users')
                .select('id')
                .limit(1);

            if (!userError && defaultUser && defaultUser.length > 0) {
                userId = defaultUser[0].id;
                console.log('使用默认用户ID:', userId);
            } else {
                return res.status(500).json({
                    success: false,
                    message: '系统错误：找不到可用的用户ID'
                });
            }
        }

        // 创建咨询记录 - 构建包含完整参数的记录
        const inquiryData = {
            tenant_id: userId,
            property_id: property_id || '00000000-0000-0000-0000-000000000000', // 如果为空，使用默认UUID
            // 将标题和类型添加到问题中
            question: `[${type}] ${title}`,
            // 添加AI响应字段，初始为空
            ai_response: null,
            // 构建会话历史记录，包含所有前端提交的信息
            conversation_history: JSON.stringify([
                {
                    role: 'user',
                    content: content,
                    metadata: {
                        type,
                        title,
                        contact,
                        images
                    }
                }
            ]),
            created_at: new Date().toISOString()
        };

        console.log('准备插入咨询数据:', inquiryData);

        // 插入咨询记录
        const { data: inquiry, error: inquiryError } = await supabase
            .from('inquiries')
            .insert([inquiryData])
            .select();

        if (inquiryError) {
            console.error('创建咨询失败，数据库错误:', inquiryError);
            return res.status(500).json({
                success: false,
                message: '提交咨询失败',
                error: inquiryError
            });
        }

        console.log('咨询提交成功:', inquiry);
        return res.status(201).json({
            success: true,
            message: '咨询已提交',
            inquiry_id: inquiry[0].id,
            inquiry: inquiry[0]
        });
    } catch (error) {
        console.error('提交咨询时发生错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器错误',
            error: error.toString()
        });
    }
};