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
async function testGetProperty() {
  console.log('开始获取现有房源信息...');
  
  try {
    // 查询公开的房源 (仅读取status列)
    console.log('\n查询所有公开的房源:');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, status')
      .eq('is_published', true)
      .limit(10);
    
    if (propertiesError) {
      console.error('获取公开房源失败:', propertiesError);
    } else {
      console.log(`找到 ${properties.length} 个公开房源:`);
      
      if (properties.length > 0) {
        const uniqueStatusValues = [...new Set(properties.map(p => p.status))];
        console.log('所有存在的status值:', uniqueStatusValues);
        
        // 输出每个房源的状态
        properties.forEach(property => {
          console.log(`房源ID: ${property.id}, 标题: ${property.title}, 状态: ${property.status}`);
        });
      }
    }
    
    // 尝试登录以获取更多权限(如果有登录API)
    console.log('\n尝试登录获取更多权限:');
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
      console.log('登录成功, 令牌:', loginData.token);
      
      // 使用获取的令牌查询后端API
      console.log('\n使用令牌查询后端API中的房源:');
      const propertiesRes = await fetch('http://localhost:3000/api/properties', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!propertiesRes.ok) {
        console.error('获取房源失败:', await propertiesRes.text());
      } else {
        const propertiesData = await propertiesRes.json();
        if (propertiesData.properties && propertiesData.properties.length > 0) {
          const apiUniqueStatusValues = [...new Set(propertiesData.properties.map(p => p.status))];
          console.log('API中所有存在的status值:', apiUniqueStatusValues);
          
          // 输出前5个房源的状态
          console.log('前5个房源信息:');
          propertiesData.properties.slice(0, 5).forEach(property => {
            console.log(`房源ID: ${property.id}, 标题: ${property.title}, 状态: ${property.status}`);
          });
        } else {
          console.log('API返回的房源列表为空');
        }
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('\n测试完成');
}

// 运行测试
testGetProperty(); 