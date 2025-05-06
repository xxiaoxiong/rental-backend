-- 备份现有数据（如果表存在）
CREATE TABLE IF NOT EXISTS banners_backup AS 
SELECT * FROM public.banners;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS public.banners;

-- 重新创建轮播图表，确保所有字段都正确
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

-- 尝试恢复备份数据（如果备份表存在并且有数据）
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'banners_backup'
    ) THEN
        -- 插入备份数据，处理可能缺少的字段
        INSERT INTO public.banners (id, title, image, link, "order", created_at, updated_at, created_by, updated_by)
        SELECT 
            id,
            title,
            image,
            link,
            COALESCE("order", ROW_NUMBER() OVER()),  -- 如果没有order字段，使用行号
            created_at,
            updated_at,
            created_by,
            updated_by
        FROM banners_backup;
    END IF;
END
$$;

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

-- 如果没有数据，插入一些示例数据
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM public.banners LIMIT 1) THEN
        INSERT INTO public.banners (title, image, link, "order", created_at, updated_at)
        VALUES 
            ('精选好房，温馨舒适', 'https://example.com/banner1.jpg', '/pages/tenant/property-list', 1, now(), now()),
            ('一键找房，轻松租赁', 'https://example.com/banner2.jpg', '/pages/tenant/property-list?tag=new', 2, now(), now()),
            ('品质生活，从这里开始', 'https://example.com/banner3.jpg', '/pages/tenant/rental-guide', 3, now(), now());
    END IF;
END
$$; 