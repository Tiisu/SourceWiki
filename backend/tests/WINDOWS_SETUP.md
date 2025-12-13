# Windows Testing Setup Guide

## Issue: MongoDB Memory Server on Windows

MongoDB Memory Server requires the **Visual C++ Redistributable** to run on Windows. If you see errors like:

```
Instance closed unexpectedly with code "3221225781"
Exit Code is large, commonly meaning that vc_redist is not installed
```

## Solution Options

### Option 1: Install Visual C++ Redistributable (Recommended for Isolation)

1. Download and install the latest Visual C++ Redistributable:
   - **x64**: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - **x86**: https://aka.ms/vs/17/release/vc_redist.x86.exe

2. After installation, restart your terminal and run tests again:
   ```bash
   npm test
   ```

**Benefits**: Tests run in complete isolation with an in-memory database.

### Option 2: Use a Real MongoDB Instance (Quick Fix)

If you have MongoDB installed locally or have access to a MongoDB instance:

1. Create a `.env.test` file in the `backend` directory:
   ```env
   TEST_MONGODB_URI=mongodb://localhost:27017/jest-test-db
   ```

2. Make sure MongoDB is running:
   ```bash
   # If using MongoDB as a service
   net start MongoDB
   
   # Or if running manually
   mongod
   ```

3. Run tests:
   ```bash
   npm test
   ```

**Note**: This uses a real database, so tests will be less isolated. The test database will be dropped after each test suite.

### Option 3: Use Docker (Alternative)

If you have Docker installed:

1. Start a MongoDB container:
   ```bash
   docker run -d -p 27017:27017 --name mongodb-test mongo:latest
   ```

2. Set the test MongoDB URI:
   ```env
   TEST_MONGODB_URI=mongodb://localhost:27017/jest-test-db
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Clean up after testing:
   ```bash
   docker stop mongodb-test
   docker rm mongodb-test
   ```

## Recommended Approach

For development:
- **Option 1** (VC++ Redistributable) provides the best isolation
- Tests run faster with in-memory database
- No need to manage a separate MongoDB instance

For CI/CD:
- Use **Option 2** or **Option 3** with a dedicated test database
- Set `TEST_MONGODB_URI` in your CI environment variables

## Troubleshooting

### Still getting errors after installing VC++ Redistributable?

1. Make sure you installed the correct version (x64 for 64-bit Windows)
2. Restart your computer after installation
3. Try running tests again

### Tests are slow with real MongoDB?

- This is expected - in-memory database is faster
- Consider installing VC++ Redistributable for better performance

### Want to use a remote MongoDB?

Set `TEST_MONGODB_URI` to your MongoDB Atlas or remote connection string:
```env
TEST_MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jest-test-db
```

**Warning**: Make sure this is a test database that can be safely dropped!

