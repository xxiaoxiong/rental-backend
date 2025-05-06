import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 使用环境变量
const supabaseUrl = process.env.SUPABASE_URL || 'https://qlyolerdqkfwehbbezfz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseW9sZXJkcWtmd2VoYmJlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjU3MzMsImV4cCI6MjA2MTM0MTczM30.fkyg2UDgGmQDlzaAL4SgNZ6nhjolEcBVTQ0gWNrQhMg';

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 主函数
async function publishProperties() {
  console.log('开始将房源设置为已发布状态...');
  
  try {
    // 1. 查询所有未发布的房源
    console.log('\n1. 查询未发布的房源:');
    const { data: unpublishedProperties, error: queryError } = await supabase
      .from('properties')
      .select('id, title, status, is_published')
      .eq('is_published', false);
    
    if (queryError) {
      console.error('查询未发布房源失败:', queryError);
      return;
    }
    
    console.log(`找到 ${unpublishedProperties.length} 个未发布房源`);
    
    if (unpublishedProperties.length === 0) {
      console.log('没有需要发布的房源');
      return;
    }
    
    // 2. 更新这些房源为已发布状态
    console.log('\n2. 更新房源为已发布状态:');
    
    for (const property of unpublishedProperties) {
      console.log(`准备发布房源: ID=${property.id}, 标题=${property.title}`);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('properties')
        .update({ 
          is_published: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', property.id)
        .select();
      
      if (updateError) {
        console.error(`更新房源 ${property.id} 失败:`, updateError);
      } else {
        console.log(`成功发布房源 ${property.id}`);
      }
    }
    
    // 3. 验证更新结果
    console.log('\n3. 验证更新结果:');
    
    const { data: publishedProperties, error: verifyError } = await supabase
      .from('properties')
      .select('id, title, status, is_published')
      .eq('is_published', true);
    
    if (verifyError) {
      console.error('验证已发布房源失败:', verifyError);
    } else {
      console.log(`现在有 ${publishedProperties.length} 个已发布房源`);
      
      if (publishedProperties.length > 0) {
        console.log('\n已发布房源列表:');
        publishedProperties.forEach(property => {
          console.log(`ID: ${property.id}, 标题: ${property.title}, 状态: ${property.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('发布房源过程中发生错误:', error);
  }
  
  console.log('\n发布操作完成');
}

// 运行函数
publishProperties(); 