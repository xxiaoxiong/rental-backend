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
async function testValidProperty() {
  console.log('开始测试有效的Properties插入操作...');
  
  try {
    // 首先，获取一个有效的用户ID（房东ID）
    console.log('\n步骤1: 获取有效的用户ID');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', 'landlord')
      .limit(1);
    
    if (usersError) {
      console.error('获取用户失败:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.error('没有找到房东角色的用户');
      
      // 如果没有找到房东用户，尝试创建一个
      console.log('尝试创建一个房东用户');
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{
          username: 'testlandlord',
          password: 'password123',
          role: 'landlord',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (createUserError) {
        console.error('创建用户失败:', createUserError);
        return;
      }
      
      if (!newUser || newUser.length === 0) {
        console.error('创建用户后未返回用户数据');
        return;
      }
      
      console.log('成功创建用户:', newUser);
      var landlordId = newUser[0].id;
    } else {
      console.log('找到房东用户:', users);
      var landlordId = users[0].id;
    }
    
    // 测试不同的status值
    console.log('\n步骤2: 测试不同status值的插入');
    
    // 测试各种可能的status值
    const statusValues = ['available', 'rented', 'pending', 'maintenance', 'inactive', 'sold', 'draft',
                          'AVAILABLE', 'RENTED', 'PENDING', 'MAINTENANCE', 'INACTIVE', 'SOLD', 'DRAFT'];
    
    for (const status of statusValues) {
      console.log(`尝试插入status值为: ${status}`);
      
      const testProperty = {
        landlord_id: landlordId,
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
        updated_at: new Date().toISOString()
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
testValidProperty(); 