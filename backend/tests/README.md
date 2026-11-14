# Backend Testing Documentation

This directory contains the test suite for the WikiSource Verifier backend API.

## Overview

The test suite uses:
- **Jest**: testing framework
- **Supertest**: HTTP assertions against the Express app
- **SQLite (in memory)**: the default test database. Nothing to install or start.
- **MariaDB**: the same tests also run against MariaDB in CI, to match ToolsDB in production

## Test Structure

```
tests/
├── env.js                      # Picks the test database before the app loads
├── setup.js                    # Creates tables per test file, empties them after each test
├── integration/                # Integration tests for API endpoints
│   ├── auth.test.js            # Authentication endpoints
│   ├── submissions.test.js     # Submission endpoints
│   └── users.test.js           # User endpoints
└── utils/
    ├── testApp.js              # Test Express app factory
    └── testHelpers.js          # Helpers for creating users, submissions and tokens
```

## Running Tests

```bash
npm test                  # all tests (in-memory SQLite)
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
npm run test:integration  # integration tests only
```

### Against MariaDB

Point the tests at an **empty, throwaway** database. Every table is dropped and
recreated, and emptied after each test.

```bash
TEST_DB_DIALECT=mariadb \
TEST_DB_HOST=127.0.0.1 TEST_DB_PORT=3306 \
TEST_DB_USER=root TEST_DB_PASSWORD=secret \
TEST_DB_NAME=sourcewiki_test \
npm test
```

## Writing Tests

Use the helpers in `utils/testHelpers.js`:

```js
import request from 'supertest';
import { createTestApp } from '../utils/testApp.js';
import { createTestUser, createTestSubmission, getAuthHeader } from '../utils/testHelpers.js';

const app = createTestApp();

it('lists my submissions', async () => {
  const user = await createTestUser();
  await createTestSubmission({}, user);

  const response = await request(app)
    .get('/api/submissions/my/submissions')
    .set('Authorization', getAuthHeader(user))
    .expect(200);

  expect(response.body.count).toBe(1);
});
```

Models are Sequelize models, so query them with Sequelize methods in tests, for
example `User.findByPk(id)`, `User.scope('withPassword').findByPk(id)` (includes
the password hash) or `CountryStats.findOne({ where: { countryCode: 'GH' } })`.

JSON array fields such as `badges`, `tags` and `verifiers` return a fresh copy
each time you read them. Reassign them instead of mutating in place:

```js
user.badges = [...user.badges, { name: 'Early Adopter', icon: '🌱' }];
await user.save();
```
