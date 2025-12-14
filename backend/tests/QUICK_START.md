# Quick Start Guide for Testing

## Current Issue

MongoDB Memory Server requires Visual C++ Redistributable on Windows, which is not installed.

## Quick Fix (Choose One)

### Option 1: Use Real MongoDB (Fastest - 2 minutes)

1. **Check if MongoDB is installed and running:**
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   
   # Or check if mongod is running
   Get-Process mongod -ErrorAction SilentlyContinue
   ```

2. **If MongoDB is not running, start it:**
   ```powershell
   # If installed as a service
   Start-Service MongoDB
   
   # Or start manually (adjust path if needed)
   & "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
   ```

3. **Create `.env.test` file in the `backend` directory:**
   ```env
   TEST_MONGODB_URI=mongodb://localhost:27017/jest-test-db
   JWT_SECRET=test-jwt-secret-key-for-testing-only
   JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

### Option 2: Install VC++ Redistributable (Best for Isolation)

1. **Download VC++ Redistributable:**
   - 64-bit: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - 32-bit: https://aka.ms/vs/17/release/vc_redist.x86.exe

2. **Install it** (double-click the downloaded file)

3. **Restart your terminal/PowerShell**

4. **Run tests:**
   ```bash
   npm test
   ```

## Verify Setup

After setting up, run a single test to verify:

```bash
npm test -- tests/integration/auth.test.js --testNamePattern="should register"
```

If you see test results (pass or fail with actual test logic), the setup is working!

## Need Help?

- See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for detailed instructions
- See [README.md](./README.md) for full testing documentation

