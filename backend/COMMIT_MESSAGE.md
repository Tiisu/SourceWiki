feat: Set up Jest testing framework with comprehensive integration tests

- Configure Jest with ESM support for Node.js backend testing
- Add MongoDB Memory Server for isolated in-memory database testing
- Implement fallback to real MongoDB instance when VC++ redistributable unavailable (Windows)
- Create test utilities and helpers for test data management:
  * Test user creation (regular, admin, verifier roles)
  * Test submission creation
  * JWT token generation for authenticated requests
  * Test data seeding and cleanup functions
- Add comprehensive integration tests for API endpoints:
  * Auth endpoints (register, login, logout, profile, password, refresh token)
  * Submission endpoints (CRUD, verification, filtering, statistics)
  * User endpoints (leaderboard, profile, admin operations)
- Configure test scripts in package.json:
  * npm test - Run all tests
  * npm run test:watch - Watch mode
  * npm run test:coverage - Coverage reports
  * npm run test:integration - Integration tests only
- Add test documentation:
  * tests/README.md - Comprehensive testing guide
  * tests/WINDOWS_SETUP.md - Windows-specific setup instructions
  * tests/QUICK_START.md - Quick setup guide
- Fix test expectations to match actual API response structures
- Remove deprecated mongoose connection options warnings

Test Coverage:
- 61 integration tests covering major API endpoints
- Authentication and authorization testing
- Input validation testing
- Error handling testing
- Role-based access control testing

Breaking Changes: None

Closes: [Issue reference if applicable]

