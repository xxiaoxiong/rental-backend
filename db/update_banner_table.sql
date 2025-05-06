-- 更新轮播图表结构，添加创建者和更新者字段
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID; 