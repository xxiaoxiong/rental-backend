const request = require('supertest');
const app = require('../index'); // 确保导出了app实例

describe('Auth API Tests', () => {
  // 测试房东登录
  test('POST /api/auth/login/password - 房东登录成功', async () => {
    // 注意：这是模拟测试，实际测试需要有效的测试数据
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        username: 'test_landlord',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });

  // 测试无效登录
  test('POST /api/auth/login/password - 登录失败（无效凭据）', async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        username: 'invalid_user',
        password: 'wrong_password'
      });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
  });
});

describe('Properties API Tests', () => {
  let authToken; // 用于存储认证令牌
  
  // 在所有测试前先登录获取令牌
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        username: 'test_landlord',
        password: 'password123'
      });
    
    authToken = res.body.token;
  });

  // 测试获取房源列表
  test('GET /api/properties - 获取房源列表', async () => {
    const res = await request(app)
      .get('/api/properties');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('properties');
    expect(Array.isArray(res.body.properties)).toBeTruthy();
  });

  // 测试获取单个房源
  test('GET /api/properties/:id - 获取单个房源', async () => {
    // 注意：需要替换为有效的房源ID
    const propertyId = 'test_property_id';
    const res = await request(app)
      .get(`/api/properties/${propertyId}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('property');
  });

  // 测试创建房源（需要认证）
  test('POST /api/properties - 创建新房源', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '测试房源',
        description: '这是一个测试房源',
        price_per_month: 3000,
        area_sqm: 80,
        bedrooms: 2,
        bathrooms: 1,
        district: '测试区',
        property_type: '整租'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('property');
  });
});

describe('AI Chat API Tests', () => {
  // 测试AI咨询
  test('POST /api/ai/chat - 发送咨询问题', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        question: '这个房子有空调吗？',
        property_id: 'test_property_id' // 可选
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('answer');
  });
});

describe('Appointments API Tests', () => {
  let tenantToken; // 租客认证令牌
  
  // 在所有测试前先登录获取令牌
  beforeAll(async () => {
    // 注意：这里需要模拟微信登录，实际测试可能需要调整
    const res = await request(app)
      .post('/api/auth/login/wechat')
      .send({
        code: 'test_wechat_code'
      });
    
    tenantToken = res.body.token;
  });

  // 测试创建预约
  test('POST /api/appointments - 创建预约', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        property_id: 'test_property_id',
        appointment_time: new Date(Date.now() + 86400000).toISOString(), // 明天
        tenant_notes: '我想看看这个房子'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('appointment');
  });
});
