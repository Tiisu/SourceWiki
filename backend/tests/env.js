// Runs before any test module is imported, so src/config reads these values.
//
// Default: an in-memory SQLite database (no setup needed).
// To test against MariaDB (as CI does), set TEST_DB_DIALECT=mariadb plus
// TEST_DB_HOST / TEST_DB_PORT / TEST_DB_USER / TEST_DB_PASSWORD / TEST_DB_NAME.
// Never point these at a real database: every table is wiped between tests.

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = process.env.TEST_DB_DIALECT || 'sqlite';
process.env.DB_STORAGE = ':memory:';

for (const key of ['HOST', 'PORT', 'USER', 'PASSWORD', 'NAME']) {
  if (process.env[`TEST_DB_${key}`] !== undefined) {
    process.env[`DB_${key}`] = process.env[`TEST_DB_${key}`];
  }
}

// Ignore any ToolsDB credentials present in the environment
delete process.env.TOOL_TOOLSDB_USER;
delete process.env.TOOL_TOOLSDB_PASSWORD;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
