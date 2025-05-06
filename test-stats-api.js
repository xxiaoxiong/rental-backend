import fetch from 'node-fetch';

async function testAuthAndStats() {
  try {
    console.log('开始测试认证和统计接口...');
    
    // 1. 登录获取令牌
    console.log('\n第1步: 登录获取JWT令牌');
    const loginRes = await fetch('http://localhost:3000/api/auth/login/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('登录结果:', loginData);
    
    if (!loginData.success || !loginData.token) {
      throw new Error('登录失败，无法获取令牌');
    }
    
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('获取到的令牌:', token);
    console.log('用户ID:', userId);
    
    // 2. 使用令牌访问统计接口
    console.log('\n第2步: 访问统计概览接口');
    const statsRes = await fetch('http://localhost:3000/api/stats/overview', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const statsData = await statsRes.json();
    console.log('统计接口返回:', statsData);
    
    // 3. 使用令牌访问示例房源统计接口
    if (statsData.success && statsData.stats && statsData.stats.total_properties > 0) {
      // 这里我们假设有房源，实际应用中应先查询房源列表获取ID
      console.log('\n第3步: 获取房源列表');
      const propertiesRes = await fetch('http://localhost:3000/api/properties', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const propertiesData = await propertiesRes.json();
      console.log('房源列表:', propertiesData.properties ? propertiesData.properties.length : 0, '个房源');
      
      if (propertiesData.properties && propertiesData.properties.length > 0) {
        const propertyId = propertiesData.properties[0].id;
        console.log('选择第一个房源ID:', propertyId);
        
        console.log('\n第4步: 访问特定房源统计接口');
        const propertyStatsRes = await fetch(`http://localhost:3000/api/stats/properties/${propertyId}`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const propertyStatsData = await propertyStatsRes.json();
        console.log('房源统计接口返回:', propertyStatsData);
      }
    }
    
    console.log('\n测试完成');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// ES Modules中需要显式引入JSON支持的模块
const importDynamic = new Function('modulePath', 'return import(modulePath)');

// 运行测试
testAuthAndStats(); 