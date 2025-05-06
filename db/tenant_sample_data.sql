-- 插入示例数据前，先获取一个示例用户ID（假设已存在用户）
-- 实际使用时请替换为真实的用户ID
DO $$
DECLARE
    sample_user_id UUID;
    sample_property_id UUID;
BEGIN
    -- 尝试获取一个已存在的用户ID，如果没有则创建一个测试用户
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE NOTICE 'No existing user found. Please create a user first or modify this script.';
        -- 这里不自动创建用户，因为auth.users表可能有特殊权限
        RETURN;
    END IF;
    
    -- 创建一个示例物业
    INSERT INTO properties (name, address, city, province, country, zipcode, type, status)
    VALUES ('测试小区', '测试地址123号', '北京市', '北京', '中国', '100000', 'apartment', 'available')
    RETURNING id INTO sample_property_id;
    
    -- 插入租房信息
    INSERT INTO rentals (tenant_id, property_id, rent_amount, start_date, end_date, status, deposit_amount)
    VALUES 
    (sample_user_id, sample_property_id, 3500.00, '2023-01-01', '2024-01-01', 'active', 3500.00);
    
    -- 插入账单
    INSERT INTO bills (tenant_id, property_id, billing_type, amount, status, due_date, description)
    VALUES
    (sample_user_id, sample_property_id, 'rent', 3500.00, 'paid', '2023-08-01', '8月租金'),
    (sample_user_id, sample_property_id, 'rent', 3500.00, 'paid', '2023-09-01', '9月租金'),
    (sample_user_id, sample_property_id, 'rent', 3500.00, 'paid', '2023-10-01', '10月租金'),
    (sample_user_id, sample_property_id, 'rent', 3500.00, 'unpaid', '2023-11-01', '11月租金'),
    (sample_user_id, sample_property_id, 'water', 120.50, 'unpaid', '2023-11-05', '10月水费'),
    (sample_user_id, sample_property_id, 'electricity', 235.80, 'unpaid', '2023-11-05', '10月电费');
    
    -- 插入维修请求
    INSERT INTO maintenance_requests (tenant_id, property_id, title, description, status, priority)
    VALUES
    (sample_user_id, sample_property_id, '水龙头漏水', '厨房水龙头一直在滴水，需要修理', 'pending', 'medium'),
    (sample_user_id, sample_property_id, '空调不制冷', '客厅的空调不制冷了，可能需要加氟', 'scheduled', 'high'),
    (sample_user_id, sample_property_id, '门锁松动', '入户门的门锁有些松动，担心安全问题', 'completed', 'medium');
    
    -- 插入公告
    INSERT INTO announcements (property_id, title, content, type, is_important)
    VALUES
    (sample_property_id, '小区安全检查通知', '定于本周六上午9点至12点进行小区安全检查，请各位住户配合', 'notice', true),
    (sample_property_id, '水电费调整通知', '从下月起，水电费将有小幅调整，详情请见物业公告栏', 'notice', true),
    (sample_property_id, '小区文化节活动', '小区将于本月15日举办文化节活动，欢迎各位住户参与', 'event', false),
    (sample_property_id, '电梯维修通知', '1号楼电梯将于明日上午10点至下午3点进行维修，请提前安排出行', 'maintenance', true);
    
    RAISE NOTICE '示例数据插入成功！用户ID: %, 物业ID: %', sample_user_id, sample_property_id;
END
$$; 