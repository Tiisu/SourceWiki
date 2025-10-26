const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'WikiMake server is running',
    timestamp: new Date().toISOString()
  });
});

// Import admin routes
const adminRoutes = require('./routes/adminRoutes');
const countryRoutes = require('./routes/countryRoutes');
const systemRoutes = require('./routes/systemRoutes');

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to WikiSourceVerifier API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin',
      models: 'MongoDB models available for team development'
    }
  });
});

// Mount admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', countryRoutes);
app.use('/api/admin', systemRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WikiMake server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});

module.exports = app;