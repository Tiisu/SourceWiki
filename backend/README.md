# WikiSourceVerifier Backend

A community-driven reference verification platform API for Wikipedia editors and Wikimedia contributors.

## Overview

WikiSourceVerifier provides a REST API for crowdsourcing and curating credible, country-based reference databases that support better citation practices on Wikipedia.

## Tech Stack

- **Framework**: Flask (Python 3.9+) with Flask-RESTful
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: Wikimedia OAuth 2.0
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Validation**: Marshmallow
- **API Documentation**: Flask-APISPEC (OpenAPI/Swagger)
- **Task Queue**: Celery + Redis
- **Testing**: Pytest + Coverage

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration management
│   ├── models/                  # SQLAlchemy models
│   │   ├── user.py
│   │   ├── reference.py
│   │   ├── verification.py
│   │   ├── country.py
│   │   └── badge.py
│   ├── routes/                  # API endpoints
│   │   ├── auth.py
│   │   ├── references.py
│   │   ├── verifications.py
│   │   ├── admin.py
│   │   └── gamification.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── reference_service.py
│   │   ├── verification_service.py
│   │   └── gamification_service.py
│   ├── middleware/              # Custom middleware
│   │   ├── auth_middleware.py
│   │   └── rate_limiter.py
│   └── utils/                   # Helper functions
├── migrations/                  # Alembic migrations
├── tests/                       # Test suite
├── scripts/                     # Utility scripts
├── requirements.txt
└── run.py
```

## Core Features

1. **Reference Submission System** - Submit URLs, PDFs, DOIs with country categorization
2. **Verification Workflow** - Country-specific admin review and approval system
3. **Public Reference Directory** - Searchable, filterable verified sources database
4. **Gamification System** - Points, badges, and leaderboards for contributors
5. **Wikimedia OAuth** - Secure authentication via Wikimedia accounts

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Initiate Wikimedia OAuth
- `GET /api/v1/auth/callback` - OAuth callback
- `GET /api/v1/auth/me` - Get current user

### References
- `POST /api/v1/references` - Submit reference
- `GET /api/v1/references` - List verified references
- `GET /api/v1/references/:id` - Get details
- `GET /api/v1/references/search` - Advanced search

### Verifications (Admin)
- `GET /api/v1/verifications/pending` - Pending queue
- `PUT /api/v1/verifications/:id` - Update status
- `POST /api/v1/verifications/:id/flag` - Flag for review

### Gamification
- `GET /api/v1/leaderboard` - Global leaderboard
- `GET /api/v1/users/:id/badges` - User badges
- `GET /api/v1/users/:id/stats` - User statistics

## Database Schema

### Core Tables
- **users** - User accounts with roles and points
- **countries** - ISO country codes and metadata
- **references** - Submitted sources with metadata
- **verifications** - Verification records by admins
- **badges** - Achievement definitions
- **user_badges** - Earned badges junction table

## Installation

```bash
# Clone and setup
git clone <repo-url>
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
flask db upgrade

# Start production server
npm start
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wikisource-verifier
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/:id` - Get single submission
- `GET /api/submissions/my/submissions` - Get user's submissions
- `PUT /api/submissions/:id` - Update submission
- `DELETE /api/submissions/:id` - Delete submission
- `PUT /api/submissions/:id/verify` - Verify submission
- `GET /api/submissions/pending/country` - Get pending for country
- `GET /api/submissions/stats` - Get statistics

### Users
- `GET /api/users/leaderboard` - Get leaderboard
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/badge` - Award badge (admin)
- `PUT /api/users/:id/role` - Update role (admin)
- `PUT /api/users/:id/deactivate` - Deactivate user (admin)
- `PUT /api/users/:id/activate` - Activate user (admin)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── submissionController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── errorHandler.js      # Error handling
│   │   └── validator.js         # Input validation
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Submission.js        # Submission schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── submissionRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── jwt.js               # Token utilities
│   └── server.js                # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Database Models

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  country: String,
  role: String (contributor|verifier|admin),
  points: Number,
  badges: Array,
  isActive: Boolean,
  refreshTokens: Array,
  timestamps: true
}
```

### Submission Model
```javascript
{
  url: String,
  title: String,
  publisher: String,
  country: String,
  category: String (primary|secondary|unreliable),
  status: String (pending|approved|rejected),
  submitter: ObjectId (ref: User),
  verifier: ObjectId (ref: User),
  wikipediaArticle: String,
  verifierNotes: String,
  verifiedAt: Date,
  fileType: String,
  fileName: String,
  tags: Array,
  timestamps: true
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- HTTP-only cookies
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Error Handling

All errors are handled centrally and return consistent JSON responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]  // Optional validation errors
}
```

## Testing

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","country":"Ghana"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password123"}'
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name wikisource-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Use production MongoDB instance
3. Generate secure JWT secrets
4. Configure CORS for production domain
5. Enable HTTPS

## Documentation

- Full API documentation: See `../API_DOCUMENTATION.md`
- Setup guide: See `../SETUP_GUIDE.md`
- Quick reference: See `../QUICK_REFERENCE.md`

## License

MIT

## Support

For issues or questions, please refer to the main project documentation.

```bash
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/dbname
WIKIMEDIA_CONSUMER_KEY=your-key
WIKIMEDIA_CONSUMER_SECRET=your-secret
REDIS_URL=redis://localhost:6379/0
```

## Testing

```bash
pytest                              # Run all tests
pytest --cov=app --cov-report=html  # With coverage
```

## Deployment

### Wikimedia Toolforge
```bash
ssh username@login.toolforge.org
toolforge webservice --backend=kubernetes python3.9 start
```

### Docker
```bash
docker-compose up -d
```

---

# Developer Task Breakdown

Backend development is divided into 5 parallel tracks for developers 1-5.

---

## TASK 1: Core Infrastructure & Authentication System

**Developer 1 - Backend Infrastructure Lead**

### Objective
Set up foundational backend architecture, database configuration, and Wikimedia OAuth authentication.

### Deliverables

#### 1.1 Project Setup
- Initialize Flask application with factory pattern
- Configure SQLAlchemy and Alembic
- Create configuration management (dev/test/prod)
- Set up `requirements.txt` and `.env.example`
- Create `run.py` entry point

#### 1.2 Database Models
- **Country Model** (`app/models/country.py`)
  - Fields: code (PK), name, region, active
  - ISO 3166-1 alpha-2 validation
- **User Model** (`app/models/user.py`)
  - Fields: id, wikimedia_id, username, email, role, country_code, points
  - Roles: contributor, country_admin, global_admin
  - Methods: `is_admin()`, `can_verify_country()`
- Create initial migrations
- Write country seed script

#### 1.3 Wikimedia OAuth Integration
- **Auth Service** (`app/services/auth_service.py`)
  - `initiate_oauth()` - Start OAuth flow
  - `handle_callback()` - Process callback
  - `get_user_info()` - Fetch Wikimedia user data
  - `create_or_update_user()` - User management
- **JWT Implementation**
  - Token generation and validation
  - Refresh token logic
- **Auth Middleware** (`app/middleware/auth_middleware.py`)
  - `@require_auth` decorator
  - `@require_role(role)` decorator
  - Token validation and user injection

#### 1.4 Auth API Routes
- `POST /api/v1/auth/login` - Initiate OAuth
- `GET /api/v1/auth/callback` - OAuth callback
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user info

#### 1.5 Testing
- Unit tests for auth service
- Integration tests for auth endpoints
- OAuth flow end-to-end test
- Role-based access control tests

### Dependencies
- Wikimedia OAuth consumer credentials
- Blocks: All other tasks

### Duration: 2 weeks

---

## TASK 2: Reference Submission & Management System

**Developer 2 - Reference Management Lead**

### Objective
Build complete reference submission system with validation, file uploads, and public API.

### Deliverables

#### 2.1 Reference Model
- **Reference Model** (`app/models/reference.py`)
  - Fields: id, url, title, publisher, doi, country_code, category, media_type, wikipedia_article, submitted_by, status
  - Enums: category (primary/secondary/unreliable), media_type (web/pdf/book/journal), status (pending/verified/rejected)
  - Relationships: User, Country, Verifications
  - Indexes: country_code, status, category, created_at
  - Methods: `is_verified()`, `can_be_edited_by(user)`

#### 2.2 Validation & Schemas
- **Marshmallow Schemas** (`app/schemas/reference_schema.py`)
  - `ReferenceSubmissionSchema` - POST validation
  - `ReferenceResponseSchema` - GET serialization
  - `ReferenceSearchSchema` - Search filters
- **Custom Validators** (`app/utils/validators.py`)
  - `validate_url()` - Check URL accessibility
  - `validate_doi()` - DOI format validation
  - `extract_metadata()` - Scrape title/publisher
  - `validate_file_upload()` - File type/size checks

#### 2.3 Reference Service
- **Reference Service** (`app/services/reference_service.py`)
  - `create_reference(data, user)` - Submit new reference
  - `get_reference(id)` - Retrieve single reference
  - `list_references(filters, pagination)` - List with filters
  - `search_references(query, filters)` - Advanced search
  - `update_reference(id, data, user)` - Update (admin only)
  - `delete_reference(id, user)` - Soft delete
  - `get_reference_stats()` - Statistics
- **File Upload Handler**
  - PDF storage with UUID naming
  - Virus scanning (ClamAV integration)
  - Thumbnail generation

#### 2.4 Reference API Routes
- `POST /api/v1/references` - Submit (authenticated)
- `GET /api/v1/references` - List verified (public)
- `GET /api/v1/references/:id` - Get details (public)
- `GET /api/v1/references/search` - Search (public)
- `PUT /api/v1/references/:id` - Update (admin)
- `DELETE /api/v1/references/:id` - Delete (admin)
- `GET /api/v1/references/stats` - Statistics (public)

#### 2.5 Features
- Pagination helper for large result sets
- Rate limiting for public endpoints
- Search filters: country, category, status, media_type, date_range

#### 2.6 Testing
- Unit tests for reference service
- Integration tests for all endpoints
- File upload functionality tests
- Search and filter tests
- Rate limiting tests

### Dependencies
- Requires: Task 1 (auth, User model)
- Blocks: Task 3 (verifications)

### Duration: 2.5 weeks

---

## TASK 3: Verification Workflow & Admin Dashboard

**Developer 3 - Verification System Lead**

### Objective
Build verification workflow, admin dashboard APIs, and review queue management.

### Deliverables

#### 3.1 Verification Model
- **Verification Model** (`app/models/verification.py`)
  - Fields: id, reference_id, verifier_id, status, notes, flagged_for_global, verified_at
  - Enum: status (credible/unreliable)
  - Relationships: Reference, User (verifier)
  - Indexes: reference_id, verifier_id, verified_at
  - Audit log for verification history

#### 3.2 Verification Service
- **Verification Service** (`app/services/verification_service.py`)
  - `get_pending_queue(country_code, user)` - Country admin queue
  - `verify_reference(ref_id, status, notes, user)` - Verify/reject
  - `flag_for_global_review(ref_id, reason, user)` - Escalate
  - `get_verification_history(ref_id)` - History
  - `get_verifier_stats(user_id)` - Verifier statistics
  - `reassign_verification(ref_id, new_verifier, user)` - Reassign
  - `bulk_verify(ref_ids, status, user)` - Bulk operations
- **Notification System**
  - Email notifications for new submissions
  - In-app notification queue

#### 3.3 Verification API Routes
- `GET /api/v1/verifications/pending` - Pending queue (country admin)
- `GET /api/v1/verifications/pending/global` - Global queue (global admin)
- `PUT /api/v1/verifications/:id` - Update status
- `POST /api/v1/verifications/:id/flag` - Flag for review
- `GET /api/v1/verifications/:id/history` - History
- `POST /api/v1/verifications/bulk` - Bulk verify
- `GET /api/v1/verifications/stats` - Statistics

#### 3.4 Admin API Routes
- `GET /api/v1/admin/users` - List users (global admin)
- `PUT /api/v1/admin/users/:id/role` - Update role
- `POST /api/v1/admin/users/:id/assign-country` - Assign country
- `GET /api/v1/admin/countries` - Manage countries
- `POST /api/v1/admin/countries` - Add country
- `PUT /api/v1/admin/countries/:code` - Update country
- `GET /api/v1/admin/analytics` - Platform analytics

#### 3.5 Analytics Service
- Total submissions by country
- Verification rate by country
- Average verification time
- Top verifiers by country
- Reliability distribution
- Export functionality (CSV, JSON)

#### 3.6 Testing
- Unit tests for verification service
- Integration tests for verification endpoints
- Role-based access control tests
- Bulk operation tests
- Analytics query performance tests

### Dependencies
- Requires: Task 1 (auth), Task 2 (references)

### Duration: 2.5 weeks

---

## TASK 4: Gamification & Community Engagement System

**Developer 4 - Gamification Lead**

### Objective
Build gamification system with points, badges, leaderboards, and user statistics.

### Deliverables

#### 4.1 Gamification Models
- **Badge Model** (`app/models/badge.py`)
  - Fields: id, name, description, icon, requirement_type, requirement_value
  - Enum: requirement_type (submissions/verifications/points)
  - Method: `check_eligibility(user)`
- **UserBadge Model** (junction table)
  - Fields: user_id, badge_id, earned_at
- Indexes for leaderboard queries

#### 4.2 Point System
- **Gamification Service** (`app/services/gamification_service.py`)
  - `award_points(user, action, amount)` - Award points
  - `calculate_submission_points(reference)` - Submission points
  - `calculate_verification_points(verification)` - Verification points
- **Point Values**
  - Submit reference: 10 points
  - Reference verified as credible: +20 bonus
  - Verify reference: 5 points
  - First submission in country: 50 bonus
- Point transaction history
- Leaderboard queries with caching

#### 4.3 Badge System
- **Badge Definitions** (seed data)
  - **First Steps**: Submit first reference
  - **Contributor**: 10 verified submissions
  - **Expert**: 50 verified submissions
  - **Guardian**: Verify 25 references
  - **Country Champion**: Top in country
  - **Global Leader**: Top 10 globally
  - **Streak Master**: 7 consecutive days
- **Badge Service Methods**
  - `check_and_award_badges(user)` - Check eligibility
  - `award_badge(user, badge)` - Award badge
  - `get_user_badges(user_id)` - Get badges
  - `get_badge_progress(user_id, badge_id)` - Progress
- Badge seed script

#### 4.4 Leaderboard System
- **Leaderboard Methods**
  - `get_global_leaderboard(limit, offset)` - Global top
  - `get_country_leaderboard(country, limit, offset)` - Country top
  - `get_user_rank(user_id)` - Global rank
  - `get_user_country_rank(user_id)` - Country rank
  - `get_trending_contributors(period)` - Week/month trending
- Redis caching for leaderboards
- Celery task for leaderboard updates

#### 4.5 User Statistics
- **Stats Methods**
  - `get_user_stats(user_id)` - Complete statistics
    - Total/verified submissions
    - Rejection rate
    - Total verifications
    - Points and badges
    - Ranks (global/country)
    - Activity streak
  - `get_user_activity_timeline(user_id)` - Recent activity
  - `get_user_contributions_by_country(user_id)` - Breakdown

#### 4.6 Gamification API Routes
- `GET /api/v1/leaderboard` - Global leaderboard
- `GET /api/v1/leaderboard/:country` - Country leaderboard
- `GET /api/v1/users/:id/badges` - User badges
- `GET /api/v1/users/:id/stats` - User statistics
- `GET /api/v1/users/:id/activity` - Activity timeline
- `GET /api/v1/badges` - List all badges
- `GET /api/v1/badges/:id` - Badge details

#### 4.7 Testing
- Unit tests for gamification service
- Integration tests for leaderboard endpoints
- Badge awarding logic tests
- Point calculation tests
- Leaderboard caching tests

### Dependencies
- Requires: Task 1, 2, 3

### Duration: 2 weeks

---

## TASK 5: API Integration, Testing & Deployment Infrastructure

**Developer 5 - DevOps & Integration Lead**

### Objective
Set up comprehensive testing, API documentation, deployment infrastructure, and integrations.

### Deliverables

#### 5.1 API Documentation
- Flask-APISPEC setup for OpenAPI
- Swagger UI at `/api/docs`
- ReDoc at `/api/redoc`
- Document all endpoints with:
  - Request/response schemas
  - Authentication requirements
  - Examples
  - Error codes
- API versioning strategy
- API changelog

#### 5.2 Comprehensive Testing
- **Test Configuration**
  - pytest.ini setup
  - Test fixtures (database, users, references)
  - Mock Wikimedia OAuth responses
- **Unit Tests**
  - All service layer tests
  - 80%+ code coverage target
- **Integration Tests**
  - Auth flow tests
  - Reference CRUD tests
  - Verification workflow tests
  - Admin operations tests
  - Gamification tests
- **Coverage Reporting**
  - HTML coverage reports
  - CI/CD integration
- Test data seeding script

#### 5.3 Rate Limiting & Security
- **Flask-Limiter Implementation**
  - Public endpoints: 100 req/hour per IP
  - Authenticated: 1000 req/hour per user
  - Admin: 5000 req/hour
- **Security Measures**
  - Request validation middleware
  - CORS configuration
  - Security headers (CSP, X-Frame-Options, etc.)
  - Input sanitization
  - SQL injection prevention
  - XSS protection

#### 5.4 Logging & Monitoring
- **Logging Setup**
  - Flask logging configuration
  - Rotating file handler
  - JSON structured logging
  - Request/response logging
- **Error Tracking**
  - Sentry integration
  - Error alerting
- **Performance Monitoring**
  - Slow query logging
  - Endpoint performance metrics
  - Database query optimization

#### 5.5 Deployment Infrastructure
- **Docker Setup**
  - Dockerfile for Flask app
  - docker-compose.yml (web, db, redis, celery)
  - Multi-stage builds
  - Environment configuration
- **CI/CD Pipeline**
  - GitHub Actions workflow
  - Automated testing
  - Linting (flake8, black)
  - Security scanning
  - Automated deployment
- **Wikimedia Toolforge Deployment**
  - Deployment scripts
  - Configuration templates
  - Database setup scripts
  - Service management

#### 5.6 External Integrations
- **Wikidata Integration**
  - Link references to Wikidata items
  - Publisher/website entity lookup
- **Wikipedia Gadget API**
  - Endpoint for citation checker
  - Source verification lookup
- **Email Service**
  - SMTP configuration
  - Email templates
  - Notification system

#### 5.7 Performance Optimization
- Database indexing strategy
- Redis caching implementation
- Query optimization
- Connection pooling
- Async task processing (Celery)
- CDN configuration for static assets

#### 5.8 Documentation
- Complete README with setup instructions
- API documentation
- Deployment guide
- Contribution guidelines
- Security best practices
- Troubleshooting guide

#### 5.9 Testing
- End-to-end integration tests
- Load testing (Locust)
- Security testing
- CI/CD pipeline tests

### Dependencies
- Requires: All tasks (1-4)

### Duration: 2.5 weeks

---

## Development Timeline

| Week | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 |
|------|--------|--------|--------|--------|--------|
| 1-2  | Auth & Infrastructure | - | - | - | - |
| 3-4  | Testing | References | - | - | - |
| 5    | Complete | References | Verifications | - | - |
| 6-7  | - | Testing | Verifications | Gamification | - |
| 8    | - | Complete | Testing | Gamification | Testing & Deployment |
| 9    | - | - | Complete | Complete | Testing & Deployment |
| 10   | - | - | - | - | Complete |

## Communication & Coordination

### Daily Standups
- Progress updates
- Blockers identification
- Interface agreements

### Integration Points
- **Task 1 → All**: Auth middleware and User model
- **Task 2 → Task 3**: Reference model and service
- **Task 2,3 → Task 4**: User actions for points
- **All → Task 5**: API endpoints for documentation

### Shared Responsibilities
- Code reviews across tasks
- Integration testing between modules
- API contract agreements
- Database migration coordination

## Success Criteria

- [ ] All API endpoints functional and documented
- [ ] 80%+ test coverage
- [ ] Wikimedia OAuth working
- [ ] Reference submission and verification workflow complete
- [ ] Gamification system operational
- [ ] Deployed to staging environment
- [ ] Performance benchmarks met (< 200ms response time)
- [ ] Security audit passed

## Support & Resources

- **Wikimedia OAuth**: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration
- **Toolforge Docs**: https://wikitech.wikimedia.org/wiki/Portal:Toolforge
- **Flask Docs**: https://flask.palletsprojects.com/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

---

For questions or issues, contact the project lead or create an issue in the repository.
