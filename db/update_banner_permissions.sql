-- 删除旧的策略
DROP POLICY IF EXISTS "允许管理员完全控制" ON public.banners;

-- 创建新的策略，允许房东和管理员操作轮播图
CREATE POLICY "允许房东和管理员完全控制" ON public.banners
    USING (auth.jwt() ->> 'role' IN ('admin', 'landlord'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'landlord')); 