const request = require('supertest');
const app = require('../app');
const { RuleRegistry } = require('../rules/ruleEngine');
const { rulesConfigSchema } = require('../validators/ruleValidator');
const defaultRules = require('../config/rules.json');

// Mock Mongoose models to avoid active database connection requirement during tests
jest.mock('../models/parcel', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const Model = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    save: mockSave
  }));
  Model.countDocuments = jest.fn().mockResolvedValue(10);
  Model.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([
      { _id: '507f1f77bcf86cd799439011', weight: 4.5, value: 250, destinationCountry: 'Ireland', status: 'ROUTED', department: 'Regular Department' }
    ])
  });
  Model.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });
  return Model;
});

jest.mock('../models/auditLog', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const Model = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: '507f1f77bcf86cd799439012',
    timestamp: new Date(),
    save: mockSave
  }));
  Model.countDocuments = jest.fn().mockResolvedValue(2);
  Model.create = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
  Model.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([
      { _id: '507f1f77bcf86cd799439012', action: 'ERROR', timestamp: new Date(), details: { message: 'Test error log' } }
    ])
  });
  Model.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
  return Model;
});

const Parcel = require('../models/parcel');
const AuditLog = require('../models/auditLog');
const routingService = require('../services/routingService');

describe('Parcel Routing System Tests', () => {
  
  beforeAll(() => {
    // Initialize routing service with default rules
    routingService.initialize(defaultRules);
  });

  describe('Rule Engine - Boundary & Logic Tests', () => {
    let registry;

    beforeEach(() => {
      registry = new RuleRegistry();
      registry.loadRules(defaultRules);
    });

    test('0.5kg parcel should be routed to Mail Department', () => {
      const match = registry.matchRule({ weight: 0.5, value: 50, destinationCountry: 'Germany' });
      expect(match).toBeDefined();
      expect(match.action.department).toBe('Mail Department');
      expect(match.action.status).toBe('ROUTED');
    });

    test('1.0kg parcel (boundary) should be routed to Mail Department', () => {
      const match = registry.matchRule({ weight: 1.0, value: 50, destinationCountry: 'Germany' });
      expect(match).toBeDefined();
      expect(match.action.department).toBe('Mail Department');
    });

    test('5.0kg parcel should be routed to Regular Department', () => {
      const match = registry.matchRule({ weight: 5.0, value: 150, destinationCountry: 'France' });
      expect(match).toBeDefined();
      expect(match.action.department).toBe('Regular Department');
    });

    test('10.0kg parcel (boundary) should be routed to Regular Department', () => {
      const match = registry.matchRule({ weight: 10.0, value: 100, destinationCountry: 'Spain' });
      expect(match).toBeDefined();
      expect(match.action.department).toBe('Regular Department');
    });

    test('10.1kg parcel should be routed to Heavy Department', () => {
      const match = registry.matchRule({ weight: 10.1, value: 200, destinationCountry: 'Italy' });
      expect(match).toBeDefined();
      expect(match.action.department).toBe('Heavy Department');
    });

    test('Value > 1000 should require Insurance Approval and override department', () => {
      const match = registry.matchRule({ weight: 0.5, value: 1001, destinationCountry: 'Germany' });
      expect(match).toBeDefined();
      expect(match.action.status).toBe('PENDING_INSURANCE_APPROVAL');
      expect(match.action.department).toBeUndefined(); // or null, depending on action
    });
  });

  describe('Configuration Validation Tests', () => {
    test('Valid rules config schema should be accepted', () => {
      const { error } = rulesConfigSchema.validate(defaultRules);
      expect(error).toBeUndefined();
    });

    test('Invalid rules missing required fields should be rejected', () => {
      const invalidRules = [
        {
          id: 'bad-rule',
          // name is missing
          conditions: [{ field: 'weight', operator: 'less_than_or_equal', value: 1 }],
          action: { status: 'ROUTED' },
          priority: 50
        }
      ];
      const { error } = rulesConfigSchema.validate(invalidRules);
      expect(error).toBeDefined();
    });

    test('Invalid condition operator should be rejected', () => {
      const invalidRules = [
        {
          id: 'bad-operator',
          name: 'Bad Operator Rule',
          conditions: [{ field: 'weight', operator: 'is_about_equal', value: 1 }], // invalid operator
          action: { status: 'ROUTED' },
          priority: 50
        }
      ];
      const { error } = rulesConfigSchema.validate(invalidRules);
      expect(error).toBeDefined();
    });
  });

  describe('Regression Protection & Extensibility Tests', () => {
    test('Adding a new high priority rule (Germany -> EU Express) works and does not regress existing rules', () => {
      const registry = new RuleRegistry();
      
      // Create new config by copying defaults and adding the new EU Express rule
      const extendedRules = [
        {
          id: 'germany-express-rule',
          name: 'EU Express Germany Rule',
          conditions: [
            { field: 'destinationCountry', operator: 'equal', value: 'Germany' }
          ],
          action: {
            department: 'EU Express Department',
            status: 'ROUTED'
          },
          priority: 95 // Higher than Mail (90) and Regular (80), lower than Insurance (100)
        },
        ...defaultRules
      ];

      // Validate new configuration
      const { error } = rulesConfigSchema.validate(extendedRules);
      expect(error).toBeUndefined();

      registry.loadRules(extendedRules);

      // Test Case 1: Germany parcel below 1kg (would match Mail, but country rule has higher priority)
      const testGermanyMail = { weight: 0.5, value: 100, destinationCountry: 'Germany' };
      const matchGermanyMail = registry.matchRule(testGermanyMail);
      expect(matchGermanyMail.action.department).toBe('EU Express Department');

      // Test Case 2: Germany parcel above 10kg (would match Heavy, country rule has higher priority)
      const testGermanyHeavy = { weight: 15.0, value: 100, destinationCountry: 'Germany' };
      const matchGermanyHeavy = registry.matchRule(testGermanyHeavy);
      expect(matchGermanyHeavy.action.department).toBe('EU Express Department');

      // Test Case 3: Germany parcel with value > 1000 (Insurance rule has priority 100, which is higher than Germany's 95)
      const testGermanyInsurance = { weight: 0.5, value: 1500, destinationCountry: 'Germany' };
      const matchGermanyInsurance = registry.matchRule(testGermanyInsurance);
      expect(matchGermanyInsurance.action.status).toBe('PENDING_INSURANCE_APPROVAL');

      // Test Case 4: France parcel below 1kg (does not match Germany rule, should fall back to original Mail rule)
      const testFranceMail = { weight: 0.5, value: 100, destinationCountry: 'France' };
      const matchFranceMail = registry.matchRule(testFranceMail);
      expect(matchFranceMail.action.department).toBe('Mail Department');
    });
  });

  describe('API Endpoints integration tests', () => {
    
    test('POST /api/parcels/route - Successfully route a single parcel', async () => {
      const response = await request(app)
        .post('/api/parcels/route')
        .send({
          weight: 4.5,
          value: 250,
          destinationCountry: 'Ireland'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.department).toBe('Regular Department');
      expect(response.body.data.status).toBe('ROUTED');
    });

    test('POST /api/parcels/route - Fail on validation (weight = 0)', async () => {
      const response = await request(app)
        .post('/api/parcels/route')
        .send({
          weight: 0, // invalid: must be greater than 0
          value: 250,
          destinationCountry: 'Ireland'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Weight must be greater than 0 kg');
    });

    test('POST /api/parcels/batch - Successfully process batch routing', async () => {
      const response = await request(app)
        .post('/api/parcels/batch')
        .send([
          { weight: 0.5, value: 50, destinationCountry: 'Germany' },
          { weight: 12, value: 1500, destinationCountry: 'USA' }
        ]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].success).toBe(true);
      expect(response.body.data[0].parcel.department).toBe('Mail Department');
      expect(response.body.data[1].parcel.status).toBe('PENDING_INSURANCE_APPROVAL');
    });

    test('GET /api/parcels/stats - Retrieve dashboard KPIs successfully', async () => {
      const response = await request(app).get('/api/parcels/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalParcelsProcessed).toBe(10);
      expect(response.body.data.errorCount).toBe(2);
    });

    test('GET /api/parcels - Retrieve parcels with filter successfully', async () => {
      const response = await request(app)
        .get('/api/parcels')
        .query({ status: 'ROUTED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].status).toBe('ROUTED');
    });

    test('GET /api/parcels/errors - Retrieve system error logs successfully', async () => {
      const response = await request(app).get('/api/parcels/errors');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].action).toBe('ERROR');
    });

    test('POST /api/parcels/reset - Reset statistics and delete all records', async () => {
      const response = await request(app).post('/api/parcels/reset');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset to zero');
    });
  });
});
