-- 创建咨询表
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID NOT NULL,
  question TEXT NOT NULL,
  ai_response TEXT,
  conversation_history JSONB DEFAULT '[]'::jsonb
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_inquiries_tenant_id ON inquiries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at); 