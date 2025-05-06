-- 创建轮播图表
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    link TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 设置RLS策略
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 只允许管理员创建、编辑和删除
CREATE POLICY "允许管理员完全控制" ON public.banners
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 允许所有人查看
CREATE POLICY "允许所有人查看" ON public.banners
    FOR SELECT
    USING (true);

-- 插入一些示例数据
INSERT INTO public.banners (title, image, link, "order", created_at, updated_at)
VALUES 
    ('精选好房，温馨舒适', 'https://example.com/banner1.jpg', '/pages/tenant/property-list', 1, now(), now()),
    ('一键找房，轻松租赁', 'https://example.com/banner2.jpg', '/pages/tenant/property-list?tag=new', 2, now(), now()),
    ('品质生活，从这里开始', 'https://example.com/banner3.jpg', '/pages/tenant/rental-guide', 3, now(), now()); 