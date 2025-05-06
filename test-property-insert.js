import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量
const supabaseUrl = process.env.SUPABASE_URL || 'https://qlyolerdqkfwehbbezfz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseW9sZXJkcWtmd2VoYmJlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjU3MzMsImV4cCI6MjA2MTM0MTczM30.fkyg2UDgGmQDlzaAL4SgNZ6nhjolEcBVTQ0gWNrQhMg';

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 主测试函数
async function testPropertyInsert() {
  console.log('开始测试Properties表插入操作...');
  
  try {
    // 1. 先检查properties表结构
    console.log('\n步骤1: 检查properties表结构');
    
    // 查询properties表的列信息
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'properties')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('获取表结构失败:', columnsError);
    } else {
      // 找到status列的信息
      const statusColumn = columns.find(col => col.column_name === 'status');
      console.log('Properties表结构:', columns);
      console.log('Status列信息:', statusColumn);
    }
    
    // 2. 测试不同status值的插入
    console.log('\n步骤2: 测试不同status值的插入');
    
    // 测试不同的status值
    const statusValues = ['available', 'rented', 'pending', 'maintenance', 'inactive', 'sold', 'draft'];
    
    for (const status of statusValues) {
      console.log(`尝试插入status值为: ${status}`);
      
      const testProperty = {
        landlord_id: '123e4567-e89b-12d3-a456-426614174000', // 示例UUID
        title: `测试房源 - ${status}`,
        description: '这是一个测试房源',
        address: '测试地址',
        city: '北京',
        district: '朝阳区',
        price_per_month: 5000,
        area_sqm: 80,
        bedrooms: 2,
        bathrooms: 1,
        property_type: 'apartment',
        amenities: ['wifi', 'parking'],
        images: [],
        status: status,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('properties')
        .insert([testProperty])
        .select();
        
      if (insertError) {
        console.error(`插入status为${status}的记录失败:`, insertError);
      } else {
        console.log(`成功插入status为${status}的记录:`, insertResult);
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('\n测试完成');
}

// 运行测试
testPropertyInsert(); 