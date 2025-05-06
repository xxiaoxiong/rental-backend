-- 创建或替换增加浏览次数的函数
CREATE OR REPLACE FUNCTION increment_view_count(property_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE properties 
    SET view_count = COALESCE(view_count, 0) + 1, 
        updated_at = timezone('utc'::text, now())
    WHERE id = property_id;
END;
$$; 