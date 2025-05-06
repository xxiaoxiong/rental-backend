-- 检查order列是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'banners' 
        AND column_name = 'order'
    ) THEN
        -- 添加order列
        ALTER TABLE public.banners ADD COLUMN "order" INTEGER;
        
        -- 为已有数据设置默认排序值
        WITH ordered_banners AS (
            SELECT id, ROW_NUMBER() OVER() as row_num
            FROM public.banners
        )
        UPDATE public.banners
        SET "order" = ordered_banners.row_num
        FROM ordered_banners
        WHERE banners.id = ordered_banners.id;
        
        -- 设置order列为非空
        ALTER TABLE public.banners ALTER COLUMN "order" SET NOT NULL;
    END IF;
END
$$; 