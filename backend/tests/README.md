# Backend Testing Documentation

This directory contains the test suite for the WikiSource Verifier backend API.

## Overview

The test suite uses:
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library for testing Express routes
- **MongoDB Memory Server** - In-memory MongoDB instance for testing (no external database required)

## Test Structure

```
tests/
├── setup.js                    # Global test setup and teardown
├── integration/                 # Integration tests for API endpoints
│   ├── auth.test.js            # Authentication endpoints
│   ├── submissions.test.js    # Submission endpoints
│   └── users.test.js           # User endpoints
└── utils/                      # Test utilities and helpers
    ├── testApp.js              # Test Express app factory
    └── testHelpers.js          # Helper functions for creating test data
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run only integration tests
```bash
npm run test:integration
```

### Run only unit tests
```bash
npm run test:unit
```

## Test Utilities

### `testHelpers.js`

Provides utility functions for creating test data:

- `createTestUser(userData)` - Create a test user
- `createTestAdmin(userData)` - Create a test admin user
- `createTestVerifier(userData)` - Create a test verifier user
- `createTestSubmission(submissionData, submitter)` - Create a test submission
- `generateToken(user, type)` - Generate JWT token for a user
- `getAuthHeader(user)` - Get authorization header for authenticated requests
- `seedTestData(options)` - Seed database with test data
- `cleanupTestData()` - Clean up all test data

### `testApp.js`

Provides a factory function to create a test Express app instance:

- `createTestApp()` - Create Express app for testing (without starting server)

## Test Data Management

### Automatic Cleanup

The test setup automatically:
- Creates an in-memory MongoDB instance before all tests
- Clears all collections after each test
- Closes the database connection after all tests

### Seeding Test Data

Use the `seedTestData()` helper to create multiple test records:

```javascript
import { seedTestData } from '../utils/testHelpers.js';

const { users, admins, verifiers, submissions } = await seedTestData({
  users: 5,
  admins: 1,
  verifiers: 2,
  submissions: 10,
  countries: ['Ghana', 'Nigeria', 'Kenya']
});
```

## Writing Tests

### Example: Testing an Authenticated Endpoint

```javascript
import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import { createTestUser, getAuthHeader } from '../utils/testHelpers.js';

describe('My API Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should access protected endpoint', async () => {
    const user = await createTestUser();
    const authHeader = getAuthHeader(user);

    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', authHeader)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Example: Testing Public Endpoint

```javascript
it('should get public data', async () => {
  const response = await request(app)
    .get('/api/public')
    .expect(200);

  expect(response.body.success).toBe(true);
});
```

## Test Coverage

The test suite aims for comprehensive coverage of:
- ✅ Authentication endpoints (register, login, logout, profile)
- ✅ Submission CRUD operations
- ✅ User management endpoints
- ✅ Authorization and role-based access control
- ✅ Input validation
- ✅ Error handling

## Environment Variables

### Required for JWT Token Generation

- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

These can be set in a `.env` file or as environment variables.

### Optional: MongoDB Configuration

By default, tests use MongoDB Memory Server (in-memory database). However, on Windows, you may need to:

1. **Install Visual C++ Redistributable** (recommended) - See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
2. **OR use a real MongoDB instance** by setting:
   - `TEST_MONGODB_URI` - Connection string to a test MongoDB instance

Example:
```env
TEST_MONGODB_URI=mongodb://localhost:27017/jest-test-db
```

**Note**: If using a real MongoDB instance, the test database will be dropped after each test suite runs.

For more details on Windows setup, see [WINDOWS_SETUP.md](./WINDOWS_SETUP.md).

## Best Practices

1. **Isolation**: Each test should be independent and not rely on data from other tests
2. **Cleanup**: Use `afterEach` hooks to clean up test data if needed
3. **Descriptive Names**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear sections for setup, execution, and verification
5. **Mock External Services**: Mock external API calls and services when possible

## Troubleshooting

### Tests failing with database connection errors
- Ensure MongoDB Memory Server is properly installed
- Check that the test setup file is correctly configured

### JWT token errors
- Verify that `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in your environment
- Check that the token generation logic matches your application's implementation

### Timeout errors
- Increase the test timeout in `jest.config.js` if tests are slow
- Check for hanging database connections or async operations

## Contributing

When adding new endpoints or features:
1. Write integration tests for all new endpoints
2. Test both success and error cases
3. Test authentication and authorization requirements
4. Update this README if adding new test utilities or patterns

