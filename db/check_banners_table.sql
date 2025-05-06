-- 检查banners表是否存在
SELECT EXISTS (
    SELECT FROM 
        pg_tables
    WHERE 
        schemaname = 'public' AND 
        tablename  = 'banners'
) AS table_exists;

-- 查看banners表的列
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' AND 
    table_name = 'banners'
ORDER BY 
    ordinal_position;

-- 查看现有的RLS策略
SELECT
    p.policyname,
    p.permissive,
    p.cmd,
    p.qual,
    p.with_check
FROM
    pg_policy p
JOIN
    pg_class c ON p.polrelid = c.oid
WHERE
    c.relname = 'banners';

-- 检查表中的数据
SELECT * FROM banners LIMIT 10; 