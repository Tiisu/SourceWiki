
import mongoose from 'mongoose';
import config from './config.js';

// MongoDB connection options for better reliability
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

// Health check function
const checkMongoDBHealth = async () => {
  try {
    // Check if mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
    }

    // Perform a simple ping operation
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      readyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    };
  }
};

// Connection retry logic with exponential backoff
const connectWithRetry = async (retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 MongoDB connection attempt ${i + 1}/${retries}...`);
      
      const conn = await mongoose.connect(config.mongodbUri, mongoOptions);
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      
      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('💥 All MongoDB connection attempts failed. Shutting down...');
        throw error;
      }
      
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

const connectDB = async () => {
  try {
    // Validate MongoDB URI before attempting connection
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB with retry logic
    const conn = await connectWithRetry();
    
    // Initial health check
    const health = await checkMongoDBHealth();
    if (health.status === 'healthy') {
      console.log('🏥 Initial MongoDB health check passed');
    } else {
      console.warn('⚠️ Initial MongoDB health check failed:', health.error);
    }

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('📡 MongoDB connected event fired');
    });

    mongoose.connection.on('error', (err) => {
      console.error('💥 MongoDB connection error:', err.message);
      console.error('💡 Please check your MongoDB server status and connection string');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      console.log('💡 The application will attempt to reconnect automatically');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
        process.exit(1);
      }
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through SIGTERM');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error.message);
        process.exit(1);
      }
    });

    // Periodic health checks (every 30 seconds)
    setInterval(async () => {
      const health = await checkMongoDBHealth();
      if (health.status === 'healthy') {
        console.log('💚 MongoDB health check passed');
      } else {
        console.error('💔 MongoDB health check failed:', health.error);
      }
    }, 30000);

    return conn;
    
  } catch (error) {
    console.error('💥 Failed to connect to MongoDB:', error.message);
    console.error('🔧 Troubleshooting steps:');
    console.error('   1. Check if MongoDB server is running');
    console.error('   2. Verify MONGODB_URI in your .env file');
    console.error('   3. Ensure network connectivity to MongoDB');
    console.error('   4. Check MongoDB authentication credentials');
    console.error('');
    console.error('📖 For more help, check MongoDB connection troubleshooting guides');
    process.exit(1);
  }
};

// Export health check function for use in routes
export { checkMongoDBHealth };
export default connectDB;
