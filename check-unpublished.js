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
async function checkUnpublishedProperties() {
  
  try {
    // 1. 先查询数据表中所有房源
    const { data: allProperties, error: allPropertiesError } = await supabase
      .from('properties')
      .select('id, title, status, is_published')
      .limit(50);
    
    if (allPropertiesError) {
    } else {
      
      if (allProperties.length > 0) {
        // 分组统计
        const published = allProperties.filter(p => p.is_published).length;
        const unpublished = allProperties.filter(p => !p.is_published).length;
        
        // 查看房源状态分布
        const statusCounts = {};
        allProperties.forEach(p => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        
      }
    }
    
    // 登录获取令牌
    const loginRes = await fetch('http://localhost:3000/api/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });
    
    if (!loginRes.ok) {
      console.error('登录失败:', await loginRes.text());
    } else {
      const loginData = await loginRes.json();
      
      // 使用令牌查询房源API
      const propertiesRes = await fetch('http://localhost:3000/api/properties', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!propertiesRes.ok) {
        console.error('API获取房源失败:', await propertiesRes.text());
      } else {
        const propertiesData = await propertiesRes.json();
        console.log('API返回结果:', propertiesData);
      }
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
  
  console.log('\n检查完成');
}

// 运行检查
checkUnpublishedProperties(); 