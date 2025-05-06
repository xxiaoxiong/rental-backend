import { createClient } from '@supabase/supabase-js';

// 使用硬编码的凭证
const supabaseUrl = 'https://qlyolerdqkfwehbbezfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseW9sZXJkcWtmd2VoYmJlemZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjU3MzMsImV4cCI6MjA2MTM0MTczM30.fkyg2UDgGmQDlzaAL4SgNZ6nhjolEcBVTQ0gWNrQhMg';

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 主测试函数
async function testConnection() {
  console.log('开始测试Supabase连接...');
  
  try {
    // 测试1: 列出所有表
    console.log('\n测试1: 列出公共schema中的表');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('获取表列表失败:', tablesError);
    } else {
      console.log('公共表列表:', tables);
    }
    
    // 测试2: 查询用户表
    console.log('\n测试2: 查询users表');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
      
    if (usersError) {
      console.error('查询users表失败:', usersError);
    } else {
      console.log('用户数量:', users ? users.length : 0);
      console.log('用户数据样例:', users && users.length > 0 ? users[0] : '无数据');
    }
    
    // 测试3: 查询auth.users表
    console.log('\n测试3: 查询auth.users表');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(1);
      
    if (authError) {
      console.error('查询auth.users表失败:', authError);
    } else {
      console.log('auth.users数据:', authUsers);
    }
    
    // 测试4: 创建一条测试记录
    console.log('\n测试4: 尝试在users表中插入一条测试记录');
    const testUser = {
      username: 'testuser',
      password: 'testpassword',
      role: 'landlord'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select();
      
    if (insertError) {
      console.error('插入测试记录失败:', insertError);
    } else {
      console.log('成功插入测试记录:', insertResult);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('\n测试完成');
}

// 运行测试
testConnection(); 