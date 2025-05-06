-- 重新创建轮播图表，更安全的方式

-- 检查是否存在备份表
DO $$
DECLARE
    backup_exists BOOLEAN;
    backup_has_data BOOLEAN;
    columns_in_backup TEXT[];
BEGIN
    -- 检查备份表是否存在
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'banners_backup'
    ) INTO backup_exists;
    
    -- 如果存在备份表，获取其列名
    IF backup_exists THEN
        -- 检查备份表是否有数据
        EXECUTE 'SELECT EXISTS (SELECT 1 FROM banners_backup LIMIT 1)' INTO backup_has_data;
        
        -- 获取备份表的列名
        SELECT array_agg(column_name) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'banners_backup'
        INTO columns_in_backup;
        
        RAISE NOTICE 'Backup table exists with columns: %', columns_in_backup;
    ELSE
        RAISE NOTICE 'No backup table exists';
    END IF;
    
    -- 删除现有表（如果存在）
    DROP TABLE IF EXISTS public.banners;
    
    -- 创建新的轮播图表
    CREATE TABLE public.banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        link TEXT,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_by UUID,
        updated_by UUID
    );
    
    -- 如果有备份表且有数据，尝试恢复数据
    IF backup_exists AND backup_has_data THEN
        -- 根据备份表中的列动态构建INSERT语句
        DECLARE
            insert_columns TEXT := '';
            select_columns TEXT := '';
            column_exists BOOLEAN;
        BEGIN
            -- ID列总是存在
            insert_columns := 'id';
            select_columns := 'id';
            
            -- 检查并添加title列
            EXECUTE format('SELECT %L = ANY($1)', 'title') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', title';
                select_columns := select_columns || ', title';
            ELSE
                insert_columns := insert_columns || ', title';
                select_columns := select_columns || ', ''标题''';
            END IF;
            
            -- 检查并添加image列
            EXECUTE format('SELECT %L = ANY($1)', 'image') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', image';
                select_columns := select_columns || ', image';
            ELSE
                insert_columns := insert_columns || ', image';
                select_columns := select_columns || ', ''https://example.com/default.jpg''';
            END IF;
            
            -- 检查并添加link列
            EXECUTE format('SELECT %L = ANY($1)', 'link') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', link';
                select_columns := select_columns || ', link';
            ELSE
                insert_columns := insert_columns || ', link';
                select_columns := select_columns || ', NULL';
            END IF;
            
            -- 检查并添加order列
            EXECUTE format('SELECT %L = ANY($1)', 'order') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', "order"';
                select_columns := select_columns || ', "order"';
            ELSE
                insert_columns := insert_columns || ', "order"';
                select_columns := select_columns || ', ROW_NUMBER() OVER()';
            END IF;
            
            -- 检查并添加created_at列
            EXECUTE format('SELECT %L = ANY($1)', 'created_at') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', created_at';
                select_columns := select_columns || ', created_at';
            ELSE
                insert_columns := insert_columns || ', created_at';
                select_columns := select_columns || ', now()';
            END IF;
            
            -- 检查并添加updated_at列
            EXECUTE format('SELECT %L = ANY($1)', 'updated_at') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', updated_at';
                select_columns := select_columns || ', updated_at';
            ELSE
                insert_columns := insert_columns || ', updated_at';
                select_columns := select_columns || ', now()';
            END IF;
            
            -- 检查并添加created_by列
            EXECUTE format('SELECT %L = ANY($1)', 'created_by') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', created_by';
                select_columns := select_columns || ', created_by';
            ELSE
                insert_columns := insert_columns || ', created_by';
                select_columns := select_columns || ', NULL';
            END IF;
            
            -- 检查并添加updated_by列
            EXECUTE format('SELECT %L = ANY($1)', 'updated_by') USING columns_in_backup INTO column_exists;
            IF column_exists THEN
                insert_columns := insert_columns || ', updated_by';
                select_columns := select_columns || ', updated_by';
            ELSE
                insert_columns := insert_columns || ', updated_by';
                select_columns := select_columns || ', NULL';
            END IF;
            
            -- 构建并执行完整的INSERT语句
            DECLARE
                insert_sql TEXT;
            BEGIN
                insert_sql := format('INSERT INTO banners (%s) SELECT %s FROM banners_backup', 
                                    insert_columns, select_columns);
                RAISE NOTICE 'Executing SQL: %', insert_sql;
                EXECUTE insert_sql;
                RAISE NOTICE 'Data restored from backup';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Error restoring data: %', SQLERRM;
            END;
        END;
    ELSE
        RAISE NOTICE 'No data to restore from backup';
    END IF;
    
    -- 设置RLS策略
    ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
    
    -- 创建允许房东和管理员操作的策略
    CREATE POLICY "允许房东和管理员完全控制" ON public.banners
        USING (auth.jwt() ->> 'role' IN ('admin', 'landlord'))
        WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'landlord'));
    
    -- 允许所有人查看的策略
    CREATE POLICY "允许所有人查看" ON public.banners
        FOR SELECT
        USING (true);
    
    -- 如果表是空的，插入一些示例数据
    IF NOT EXISTS (SELECT FROM public.banners LIMIT 1) THEN
        INSERT INTO public.banners (title, image, link, "order", created_at, updated_at)
        VALUES 
            ('精选好房，温馨舒适', 'https://example.com/banner1.jpg', '/pages/tenant/property-list', 1, now(), now()),
            ('一键找房，轻松租赁', 'https://example.com/banner2.jpg', '/pages/tenant/property-list?tag=new', 2, now(), now()),
            ('品质生活，从这里开始', 'https://example.com/banner3.jpg', '/pages/tenant/rental-guide', 3, now(), now());
        RAISE NOTICE 'Sample data inserted';
    END IF;
END
$$; 