const request = require('supertest');
const app = require('../app');

// Mock Mongoose models to avoid database connections during test runs
jest.mock('../models/parcel', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const Model = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave
  }));
  // Mock query helpers
  Model.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([
      { _id: 'mock-id', weight: 1, value: 50, destinationCountry: 'Germany', status: 'ROUTED', department: 'Mail Department' }
    ])
  });
  return Model;
});

jest.mock('../models/auditLog', () => {
  const Model = jest.fn();
  Model.create = jest.fn().mockResolvedValue({ _id: 'mock-audit-id' });
  return Model;
});

describe('Authentication & Route Authorization Tests', () => {
  
  describe('Login API Endpoint (POST /api/auth/login)', () => {
    test('Should authenticate successfully with correct demo credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('admin');
      expect(response.body.data.token).toBe('demo-routing-token-xyz');
    });

    test('Should fail authentication with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid username or password');
    });

    test('Should return 400 Bad Request if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
          // password missing
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Username and password are required');
    });
  });

  describe('Route Protection Middleware (GET /api/parcels)', () => {
    test('Should block access (401) if Authorization header is missing', async () => {
      const response = await request(app)
        .get('/api/parcels');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authentication required');
    });

    test('Should block access (401) if token prefix is not Bearer', async () => {
      const response = await request(app)
        .get('/api/parcels')
        .set('Authorization', 'Basic YWRtaW46YWRtaW4xMjM='); // Basic auth instead of Bearer

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Authentication required');
    });

    test('Should block access (401) if Bearer token is incorrect', async () => {
      const response = await request(app)
        .get('/api/parcels')
        .set('Authorization', 'Bearer invalid-token-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired session token');
    });

    test('Should grant access (200) when a valid demo Bearer token is supplied', async () => {
      const response = await request(app)
        .get('/api/parcels')
        .set('Authorization', 'Bearer demo-routing-token-xyz');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
