import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let useMemoryServer = true;

// Setup before all tests
beforeAll(async () => {
  try {
    let mongoUri;
    
    // Check if a test MongoDB URI is provided (for CI/CD or when VC++ redistributable is not available)
    if (process.env.TEST_MONGODB_URI) {
      console.log('Using provided TEST_MONGODB_URI for testing');
      mongoUri = process.env.TEST_MONGODB_URI;
      useMemoryServer = false;
    } else {
      // Try to use MongoDB Memory Server
      try {
        mongoServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'jest-test-db'
          }
        });
        mongoUri = mongoServer.getUri();
      } catch (memoryServerError) {
        // If Memory Server fails (e.g., VC++ redistributable not installed on Windows)
        // Fall back to a local MongoDB instance if available
        if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
          console.warn('MongoDB Memory Server failed, falling back to local MongoDB');
          console.warn('Error:', memoryServerError.message);
          console.warn('Note: For better isolation, install VC++ Redistributable or use TEST_MONGODB_URI');
          mongoUri = process.env.MONGODB_URI.replace(/\/[^\/]+$/, '/jest-test-db');
          useMemoryServer = false;
        } else {
          // Provide helpful error message with instructions
          const errorMessage = 
            '\n' +
            '═══════════════════════════════════════════════════════════════\n' +
            'MongoDB Memory Server Failed to Start\n' +
            '═══════════════════════════════════════════════════════════════\n\n' +
            'On Windows, MongoDB Memory Server requires Visual C++ Redistributable.\n\n' +
            'QUICK FIX OPTIONS:\n\n' +
            'Option 1: Use a Real MongoDB Instance (Easiest)\n' +
            '  1. Create a .env.test file in the backend directory\n' +
            '  2. Add: TEST_MONGODB_URI=mongodb://localhost:27017/jest-test-db\n' +
            '  3. Make sure MongoDB is running locally\n' +
            '  4. Run tests again: npm test\n\n' +
            'Option 2: Install VC++ Redistributable (Best for Isolation)\n' +
            '  1. Download: https://aka.ms/vs/17/release/vc_redist.x64.exe\n' +
            '  2. Install and restart your terminal\n' +
            '  3. Run tests again: npm test\n\n' +
            'For more details, see: tests/WINDOWS_SETUP.md\n' +
            '═══════════════════════════════════════════════════════════════\n' +
            '\nOriginal error: ' + memoryServerError.message;
          
          throw new Error(errorMessage);
        }
      }
    }
    
    // Disconnect any existing connections first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the database
    // Note: useNewUrlParser and useUnifiedTopology are deprecated in mongoose 6+
    // but kept for compatibility
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}, 120000);

// Cleanup after each test
afterEach(async () => {
  try {
    // Clear all collections
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      const collectionNames = Object.keys(collections);
      
      for (const collectionName of collectionNames) {
        try {
          await collections[collectionName].deleteMany({});
        } catch (error) {
          // Ignore errors if collection doesn't exist or is already dropped
          if (error.name !== 'MongoServerError') {
            console.warn(`Error clearing collection ${collectionName}:`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error in afterEach cleanup:', error.message);
  }
});

// Teardown after all tests
afterAll(async () => {
  try {
    // Close mongoose connection
    if (mongoose.connection.readyState === 1) {
      // Drop database (only if using memory server or test database)
      if (useMemoryServer || process.env.TEST_MONGODB_URI) {
        try {
          await mongoose.connection.db.dropDatabase();
        } catch (error) {
          // Ignore if database doesn't exist
        }
      }
      
      // Close connection
      await mongoose.connection.close();
    }
    
    // Force disconnect any remaining connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Stop the in-memory MongoDB instance (only if we created one)
    if (mongoServer && useMemoryServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  } catch (error) {
    console.error('Error in afterAll teardown:', error);
    // Force cleanup
    try {
      if (mongoServer && useMemoryServer) {
        await mongoServer.stop();
        mongoServer = null;
      }
    } catch (e) {
      // Ignore
    }
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore
    }
  }
}, 30000);

