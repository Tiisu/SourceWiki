# WikiSourceVerifier - Clean MVC Architecture 🏗️

## 📁 **Project Structure**

```
server/
├── controllers/           # Business logic controllers
│   ├── adminController.js      # Admin dashboard & user management
│   ├── countryController.js    # Country & verifier management  
│   ├── systemController.js     # System monitoring & maintenance
│   └── reportsController.js    # Reports & analytics generation
├── routes/               # API route definitions
│   ├── adminRoutes.js          # Admin routes with validation
│   ├── countryRoutes.js        # Country management routes
│   └── systemRoutes.js         # System & reports routes
├── tours/                # Validation middleware
│   ├── adminValidation.js      # Admin endpoint validation
│   ├── countryValidation.js    # Country management validation
│   └── systemValidation.js     # System & reports validation
├── models/               # MongoDB data models
│   ├── User.js                 # User model with auth
│   ├── Submission.js           # Submission workflow model
│   ├── CountryStats.js         # Country statistics model
│   └── index.js                # Model exports
├── middleware/           # Custom middleware
│   └── auth.js                 # Authentication & authorization
├── config/               # Configuration files
│   └── database.js             # MongoDB connection setup
└── index.js              # Main server file
```

## 🎯 **MVC Architecture Benefits**

### **Controllers** 📊
- **Separation of Concerns**: Business logic isolated from routes
- **Reusability**: Controller methods can be used across different routes
- **Testability**: Easy to unit test business logic
- **Error Handling**: Centralized error management

### **Routes** 🛣️
- **Clean API Structure**: RESTful endpoint definitions
- **Middleware Integration**: Validation and auth middleware
- **Documentation**: JSDoc comments for each endpoint
- **Modular Organization**: Grouped by functionality

### **Tours (Validation)** ✅
- **Input Validation**: Express-validator rules
- **Security**: Sanitization and data validation
- **Consistency**: Standardized validation across endpoints
- **Error Prevention**: Catch issues before business logic

## 🔄 **Request Flow**

```
1. Request → Route → Validation → Authentication → Controller → Response
```

**Example Flow:**
```javascript
GET /api/admin/users
↓
adminRoutes.js (route definition)
↓
adminValidation.getUsers (validation middleware)
↓
authenticateToken + requireAdmin (auth middleware)
↓
AdminController.getUsers (business logic)
↓
Response with user data
```

## 📋 **Controller Classes**

### **AdminController**
```javascript
class AdminController {
  static async getDashboard(req, res)     // Global platform overview
  static async getAnalytics(req, res)     // Detailed analytics
  static async getUsers(req, res)         // User management
  static async updateUser(req, res)       // Update user details
  static async deleteUser(req, res)       // Soft delete users
  static async getSubmissions(req, res)   // Submission management
  static async overrideSubmission(req, res) // Admin override decisions
  static async flagSubmission(req, res)   // Flag problematic content
  static async deleteSubmission(req, res) // Delete submissions
}
```

### **CountryController**
```javascript
class CountryController {
  static async getCountries(req, res)     // List countries with stats
  static async createCountry(req, res)    // Create new country
  static async updateCountry(req, res)    // Update country details
  static async refreshCountryStats(req, res) // Refresh statistics
  static async getVerifiers(req, res)     // List all verifiers
  static async assignVerifier(req, res)   // Assign verifier to country
  static async updateVerifier(req, res)   // Update verifier details
  static async removeVerifier(req, res)   // Remove verifier assignment
}
```

### **SystemController**
```javascript
class SystemController {
  static async getSystemHealth(req, res)  // System health monitoring
  static async getSystemLogs(req, res)    // Activity logs
  static async runMaintenance(req, res)   // Automated maintenance tasks
}
```

### **ReportsController**
```javascript
class ReportsController {
  static async getOverviewReport(req, res) // Platform overview report
  static async getCountryReport(req, res)  // Country-specific report
  static async exportData(req, res)        // Data export (JSON/CSV)
}
```

## 🛡️ **Validation Tours**

### **Comprehensive Validation Coverage**
- **Input Sanitization**: XSS prevention, data cleaning
- **Type Validation**: Ensure correct data types
- **Range Validation**: Min/max values for numbers
- **Format Validation**: Email, dates, MongoDB ObjectIds
- **Business Rules**: Role-based validation, country codes

### **Example Validation Tour**
```javascript
adminValidation.updateUser: [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['admin', 'country_verifier', 'contributor']),
  body('points').optional().isInt({ min: 0 }),
  body('badges').optional().isArray()
]
```

## 🔐 **Security Features**

### **Authentication & Authorization**
- **JWT Token Validation**: Secure token verification
- **Role-Based Access**: Admin, verifier, contributor roles
- **Route Protection**: All admin routes require authentication
- **Account Security**: Prevent self-modification

### **Input Security**
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Prevention**: Input sanitization and escaping
- **Data Validation**: Type checking and format validation
- **Rate Limiting Ready**: Structure supports rate limiting middleware

## 🚀 **Production Ready Features**

### **Error Handling**
- **Consistent Error Format**: Standardized error responses
- **Proper HTTP Status Codes**: RESTful status code usage
- **Error Logging**: Console logging for debugging
- **Validation Error Details**: Specific validation failure messages

### **Performance Optimizations**
- **Database Indexing**: Optimized queries in models
- **Pagination Support**: All list endpoints support pagination
- **Parallel Processing**: Use Promise.all for concurrent operations
- **Memory Efficient**: Lean queries for large datasets

### **Monitoring & Maintenance**
- **Health Checks**: System health monitoring endpoint
- **Activity Logging**: Comprehensive audit trails
- **Maintenance Tasks**: Automated cleanup and optimization
- **Statistics Tracking**: Real-time platform metrics

## 📚 **API Documentation**

Each route includes:
- **JSDoc Comments**: Detailed endpoint documentation
- **Parameter Descriptions**: Query and body parameter details
- **Access Control**: Role requirements clearly specified
- **Example Usage**: Request/response examples in documentation

## 🧪 **Testing Structure**

The clean architecture enables easy testing:
```javascript
// Unit test controllers
describe('AdminController', () => {
  test('getDashboard returns global statistics', async () => {
    // Test business logic in isolation
  });
});

// Integration test routes
describe('Admin Routes', () => {
  test('GET /api/admin/dashboard requires authentication', async () => {
    // Test full request flow
  });
});
```

## 🔄 **Team Collaboration**

### **Clear Responsibilities**
- **Backend Team**: Work on controllers and business logic
- **API Team**: Focus on routes and validation
- **Frontend Team**: Use documented API endpoints
- **DevOps Team**: Deploy with clear separation of concerns

### **Easy Maintenance**
- **Modular Structure**: Changes isolated to specific files
- **Consistent Patterns**: Similar structure across all features
- **Documentation**: Self-documenting code with JSDoc
- **Version Control**: Clean git history with logical file organization

This architecture provides a **production-ready, scalable, and maintainable** foundation for your WikiSourceVerifier admin features! 🎉