-- 方法1：使用存储桶创建函数
-- 如果数据库中存在此函数，则使用它创建存储桶
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_bucket') THEN
        PERFORM create_bucket('images', 'Public images bucket');
    END IF;
END
$$;

-- 方法2：直接插入存储桶表
-- 如果没有create_bucket函数，直接尝试插入buckets表
INSERT INTO storage.buckets (id, name, public)
SELECT 'images', 'images', true
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'storage' AND table_name = 'buckets'
)
ON CONFLICT (id) DO NOTHING;

-- 方法3：使用RLS策略（如果存在）
DO $$
DECLARE
    policy_table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'storage' AND table_name = 'policies'
    ) INTO policy_table_exists;

    IF policy_table_exists THEN
        -- 尝试插入访问策略
        BEGIN
            INSERT INTO storage.policies (name, bucket_id, operation, definition, check_schema)
            VALUES 
              ('Public Access', 'images', 'SELECT', 'true', false),
              ('Public Upload', 'images', 'INSERT', 'true', false),
              ('Public Update', 'images', 'UPDATE', 'true', false),
              ('Public Delete', 'images', 'DELETE', 'true', false)
            ON CONFLICT (bucket_id, name) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create storage policies: %', SQLERRM;
        END;
    END IF;
END
$$;

-- 方法4：使用对象存储API
-- 注意：这需要管理员权限
DO $$
BEGIN
    -- 尝试创建图片桶的RLS策略（如果bucket_policy_fn存在）
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'storage_admin') THEN
        BEGIN
            PERFORM storage_admin.create_policy(
                'images',
                'Public Select',
                'SELECT',
                'everyone',
                true
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create SELECT policy: %', SQLERRM;
        END;

        BEGIN
            PERFORM storage_admin.create_policy(
                'images',
                'Public Insert',
                'INSERT',
                'everyone',
                true
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create INSERT policy: %', SQLERRM;
        END;
    END IF;
END
$$; 