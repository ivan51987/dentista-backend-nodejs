const request = require('supertest');
const app = require('../src/app');
const { Patient } = require('../src/models');

describe('Patient API', () => {
  beforeEach(async () => {
    await Patient.destroy({ where: {} });
  });

  test('should create a new patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data.firstName).toBe('John');
  });
});