-- 创建一个函数，用于检查某个表的某个列是否存在
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 