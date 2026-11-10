# WikiSource Verifier API Documentation

## Base URL
```
http://localhost:5000/api
```

## Global Endpoints (Root Level)

These endpoints are accessible at the root URL (`http://localhost:5000`), outside the `/api` prefix.

### API Welcome
**GET** `/`

Welcome route providing API version and basic information.

**Response (200):**
```json
{
  "success": true,
  "message": "WikiSource Verifier API",
  "version": "1.0.0",
  "documentation": "/api/docs"
}
```

---

### Global Health Check
**GET** `/health`

Basic server health check.

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-16T14:20:00.000Z"
}
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

Tokens are also sent as HTTP-only cookies for enhanced security.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "country": "Ghana"
}
```

**Response (201):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "Ghana",
    "role": "contributor",
    "points": 0,
    "badges": [],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric and underscores only
- Email: Valid email format
- Password: Minimum 6 characters
- Country: Required

---

### Login
**POST** `/auth/login`

Authenticate a user and receive tokens.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "Ghana",
    "role": "contributor",
    "points": 150,
    "badges": [],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

---

### Logout
**POST** `/auth/logout`

Logout the current user (clears cookies).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/auth/me`

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "Ghana",
    "role": "contributor",
    "points": 150,
    "badges": [],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

---

### Refresh Token
**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "Ghana",
    "role": "contributor",
    "points": 150,
    "badges": [],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

---

### Update Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "country": "Nigeria"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "newemail@example.com",
    "country": "Nigeria",
    "role": "contributor",
    "points": 150,
    "badges": [],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

---

### Change Password
**PUT** `/auth/password`

Change user password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

## Submission Endpoints

### Create Submission
**POST** `/submissions`

Submit a new reference for verification.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "url": "https://example.com/article",
  "title": "Climate Change Report 2024",
  "publisher": "Ghana Environmental Agency",
  "country": "Ghana",
  "category": "secondary",
  "wikipediaArticle": "https://en.wikipedia.org/wiki/Climate_change",
  "fileType": "url",
  "fileName": "report_2024.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "submission": {
    "id": "507f1f77bcf86cd799439012",
    "url": "https://example.com/article",
    "title": "Climate Change Report 2024",
    "publisher": "Ghana Environmental Agency",
    "country": "Ghana",
    "category": "secondary",
    "status": "pending",
    "submitter": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "country": "Ghana"
    },
    "wikipediaArticle": "https://en.wikipedia.org/wiki/Climate_change",
    "fileType": "url",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Points Awarded:** 10 points for submission

---

### Get All Submissions
**GET** `/submissions`

Get all submissions with optional filters.

**Query Parameters:**
- `country` (optional): Filter by country
- `category` (optional): Filter by category (primary, secondary, unreliable)
- `status` (optional): Filter by status (pending, approved, rejected)
- `search` (optional): Search in title and publisher
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Example:**
```
GET /submissions?country=Ghana&status=approved&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "submissions": [
    {
      "id": "507f1f77bcf86cd799439012",
      "url": "https://example.com/article",
      "title": "Climate Change Report 2024",
      "publisher": "Ghana Environmental Agency",
      "country": "Ghana",
      "category": "secondary",
      "status": "approved",
      "submitter": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe",
        "country": "Ghana"
      },
      "verifier": {
        "id": "507f1f77bcf86cd799439013",
        "username": "janeverifier",
        "country": "Ghana"
      },
      "verifierNotes": "Credible government source",
      "verifiedAt": "2025-01-16T14:20:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-16T14:20:00.000Z"
    }
  ]
}
```

---

### Get Single Submission
**GET** `/submissions/:id`

Get detailed information about a specific submission.

**Response (200):**
```json
{
  "success": true,
  "submission": {
    "id": "507f1f77bcf86cd799439012",
    "url": "https://example.com/article",
    "title": "Climate Change Report 2024",
    "publisher": "Ghana Environmental Agency",
    "country": "Ghana",
    "category": "secondary",
    "status": "approved",
    "submitter": {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "email": "john@example.com",
      "country": "Ghana",
      "role": "contributor",
      "points": 150,
      "badges": []
    },
    "verifier": {
      "id": "507f1f77bcf86cd799439013",
      "username": "janeverifier",
      "country": "Ghana",
      "role": "verifier"
    },
    "wikipediaArticle": "https://en.wikipedia.org/wiki/Climate_change",
    "verifierNotes": "Credible government source",
    "verifiedAt": "2025-01-16T14:20:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-16T14:20:00.000Z"
  }
}
```

---

### Get My Submissions
**GET** `/submissions/my/submissions`

Get all submissions created by the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "page": 1,
  "pages": 1,
  "submissions": [ ... ]
}
```

---

### Update Submission
**PUT** `/submissions/:id`

Update a pending submission (only by submitter).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "publisher": "Updated Publisher",
  "category": "primary",
  "wikipediaArticle": "https://en.wikipedia.org/wiki/New_article"
}
```

**Response (200):**
```json
{
  "success": true,
  "submission": { ... }
}
```

**Note:** Can only update submissions with status "pending"

---

### Delete Submission
**DELETE** `/submissions/:id`

Delete a submission (submitter or admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Submission deleted successfully"
}
```

---

### Verify Submission
**PUT** `/submissions/:id/verify`

Verify or reject a submission (verifier/admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** verifier, admin

**Request Body:**
```json
{
  "status": "approved",
  "credibility": "credible",
  "verifierNotes": "Credible government source with proper citations"
}
```

*Note: The `credibility` field is required when `status` is set to `approved`.*

**Response (200):**
```json
{
  "success": true,
  "submission": {
    "id": "507f1f77bcf86cd799439012",
    "status": "approved",
    "verifier": {
      "id": "507f1f77bcf86cd799439013",
      "username": "janeverifier",
      "country": "Ghana"
    },
    "verifierNotes": "Credible government source with proper citations",
    "verifiedAt": "2025-01-16T14:20:00.000Z",
    ...
  }
}
```

**Points Awarded:**
- Submitter: 25 points (if approved)
- Verifier: 5 points

---

### Get Pending Submissions for Country
**GET** `/submissions/pending/country`

Get pending submissions for the verifier's country.

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** verifier, admin

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 10,
  "page": 1,
  "pages": 1,
  "submissions": [ ... ]
}
```

---

### Get Submission Statistics
**GET** `/submissions/stats`

Get statistics about submissions.

**Query Parameters:**
- `country` (optional): Filter by country

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 500,
    "pending": 50,
    "approved": 400,
    "rejected": 50,
    "primary": 100,
    "secondary": 350,
    "unreliable": 50
  },
  "topCountries": [
    {
      "_id": "Ghana",
      "count": 150
    },
    {
      "_id": "Nigeria",
      "count": 120
    }
  ]
}
```

---

## User Endpoints

### Get User Profile
**GET** `/users/:id`

Get a user's public profile and statistics.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "country": "Ghana",
    "role": "contributor",
    "points": 150,
    "badges": [
      {
        "name": "First Submission",
        "icon": "🎯",
        "earnedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "joinDate": "2025-01-15T10:30:00.000Z",
    "isActive": true
  },
  "stats": {
    "total": 15,
    "approved": 12,
    "pending": 2,
    "rejected": 1
  }
}
```

---

### Get Leaderboard
**GET** `/users/leaderboard`

Get top users by points.

**Query Parameters:**
- `country` (optional): Filter by country
- `limit` (optional, default: 20): Number of users to return

**Response (200):**
```json
{
  "success": true,
  "count": 20,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "country": "Ghana",
      "role": "contributor",
      "points": 500,
      "badges": [ ... ],
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get All Users (Admin)
**GET** `/users`

Get all users with filters (admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** admin

**Query Parameters:**
- `role` (optional): Filter by role
- `country` (optional): Filter by country
- `search` (optional): Search username or email
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response (200):**
```json
{
  "success": true,
  "count": 20,
  "total": 250,
  "page": 1,
  "pages": 13,
  "users": [ ... ]
}
```

---

### Award Badge (Admin)
**POST** `/users/:id/badge`

Award a badge to a user (admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** admin

**Request Body:**
```json
{
  "name": "Top Contributor",
  "icon": "🏆"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### Update User Role (Admin)
**PUT** `/users/:id/role`

Update a user's role (admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** admin

**Request Body:**
```json
{
  "role": "verifier"
}
```

**Valid Roles:** contributor, verifier, admin

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### Deactivate User (Admin)
**PUT** `/users/:id/deactivate`

Deactivate a user account (admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** admin

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "user": { ... }
}
```

---

### Activate User (Admin)
**PUT** `/users/:id/activate`

Activate a user account (admin only).

**Headers:** `Authorization: Bearer <token>`

**Roles Required:** admin

**Response (200):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "user": { ... }
}
```

---

## Admin Endpoints

### Get Dashboard
**GET** `/admin/dashboard`

Get global statistics and recent activity for the admin dashboard.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "globalStats": {
    "totalUsers": 250,
    "totalSubmissions": 500,
    "usersByRole": { "contributor": 200, "verifier": 40, "admin": 10 },
    "submissionsByStatus": { "approved": 400, "pending": 50, "rejected": 50 }
  },
  "charts": {
    "submissionsByCountry": [ ],
    "topCountries": [ ]
  },
  "recentActivity": [ ]
}
```

---

### Get Analytics
**GET** `/admin/analytics`

Get trends and verification speed analytics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `period` (optional, default: 30d): 7d, 30d, 90d, 1y
- `country` (optional): Filter by country code

**Response (200):**
```json
{
  "period": "30d",
  "country": "GH",
  "trends": [ ],
  "verificationSpeed": [ ],
  "generated": "2025-01-16T14:20:00.000Z"
}
```

---

### Get Users (Admin)
**GET** `/admin/users`

Get all users with their submission statistics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `page`, `limit`, `role`, `country`, `status` (active/inactive), `search`

**Response (200):**
```json
{
  "users": [
    {
      "_id": "...",
      "username": "johndoe",
      "submissionStats": { "total": 10, "approved": 8, "pending": 1, "rejected": 1 }
    }
  ],
  "pagination": { }
}
```

---

### Update User
**PUT** `/admin/users/:id`

Update any user's role, status, points, or badges.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "role": "verifier",
  "isActive": true,
  "country": "GH",
  "points": 150,
  "badges": [ ]
}
```

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": { }
}
```

---

### Delete User (Soft Delete)
**DELETE** `/admin/users/:id`

Soft delete a user account.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "message": "User deleted successfully",
  "user": { }
}
```

---

### Get Submissions (Admin)
**GET** `/admin/submissions`

Get submissions with advanced filtering.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `page`, `limit`, `status`, `category`, `country`, `search`

**Response (200):**
```json
{
  "submissions": [ ],
  "pagination": { }
}
```

---

### Override Submission Status
**PUT** `/admin/submissions/:id/override`

Admin override for a submission's status.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "status": "approved",
  "adminNotes": "Overridden by admin after review",
  "reason": "Additional verification found"
}
```

**Response (200):**
```json
{
  "message": "Submission override successful",
  "submission": { }
}
```

---

### Delete Submission (Admin)
**DELETE** `/admin/submissions/:id`

Permanently delete a submission.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body (Optional):**
```json
{
  "reason": "Spam"
}
```

**Response (200):**
```json
{
  "message": "Submission deleted successfully"
}
```

---

## Country Endpoints

### Get All Countries
**GET** `/countries`

Get a paginated list of countries and their statistics.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `search` (optional): Search by country name or code
- `sortBy` (optional): name, submissions, verifiers, or activity

**Response (200):**
```json
{
  "countries": [ ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 100,
    "limit": 20
  }
}
```

---

### Get Country Stats
**GET** `/countries/:code/stats`

Get detailed statistics and top contributors/verifiers for a specific country.

**Response (200):**
```json
{
  "countryCode": "GH",
  "countryName": "Ghana",
  "statistics": { },
  "topContributors": [ ],
  "topVerifiers": [ ]
}
```

---

### Get Country Submissions
**GET** `/countries/:code/submissions`

Get submissions for a specific country.

**Query Parameters:**
- `page`, `limit`, `status`, `category`

**Response (200):**
```json
{
  "success": true,
  "submissions": [ ],
  "pagination": { }
}
```

---

### Create Country (Admin)
**POST** `/countries`

Create a new country record.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "countryCode": "GH",
  "countryName": "Ghana"
}
```

**Response (201):**
```json
{
  "message": "Country created successfully",
  "country": { }
}
```

---

### Update Country (Admin)
**PUT** `/countries/:code`

Update country details.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "countryName": "New Name"
}
```

**Response (200):**
```json
{
  "message": "Country updated successfully",
  "country": { }
}
```

---

### Delete Country (Admin)
**DELETE** `/countries/:code`

Delete a country record (only if it has no submissions).

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "message": "Country deleted successfully"
}
```

---

### Update Country Stats (Admin)
**POST** `/countries/:code/update-stats`

Manually trigger an update of country statistics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "message": "Country statistics updated successfully",
  "country": { }
}
```

---

### Assign Verifier (Admin)
**POST** `/countries/:code/assign-verifier`

Assign a user as a verifier for a country.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "specializations": ["environment", "health"]
}
```

**Response (200):**
```json
{
  "message": "Verifier assigned successfully",
  "country": { }
}
```

---

### Remove Verifier (Admin)
**POST** `/countries/:code/remove-verifier`

Remove a verifier from a country.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**
```json
{
  "message": "Verifier removed successfully",
  "country": { }
}
```

---

## Reports Endpoints

### Get Overview Report
**GET** `/reports/overview`

Get a general overview report.

**Headers:** `Authorization: Bearer <token>` (Verifier or Admin)

**Query Parameters:**
- `startDate` (optional, defaults to 30 days ago)
- `endDate` (optional, defaults to now)
- `country` (optional)

**Response (200):**
```json
{
  "period": { "startDate": "...", "endDate": "...", "country": "all" },
  "summary": { "totalSubmissions": 500, "approvedSubmissions": 400, "approvalRate": 80 },
  "breakdown": { "byCategory": [ ], "byCountry": [ ] },
  "generated": "2025-01-16T14:20:00.000Z"
}
```

---

### Get Country Report
**GET** `/reports/country/:country`

Get a detailed report for a specific country.

**Headers:** `Authorization: Bearer <token>` (Verifier or Admin)

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response (200):**
```json
{
  "country": { "code": "GH", "name": "Ghana" },
  "period": { },
  "summary": { },
  "breakdown": { },
  "currentStats": { },
  "generated": "..."
}
```

---

### Get User Report
**GET** `/reports/user/:userId`

Get a detailed report of a user's submissions.

**Headers:** `Authorization: Bearer <token>` (Verifier or Admin)

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response (200):**
```json
{
  "user": { "id": "...", "username": "..." },
  "period": { },
  "summary": { },
  "breakdown": { },
  "generated": "..."
}
```

---

## System Endpoints

### Get System Health
**GET** `/system/health`

Get overall system health and database connectivity.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "timestamp": "2025-01-16T14:20:00.000Z",
  "status": "healthy",
  "database": "connected",
  "issues": []
}
```

---

### Get System Logs
**GET** `/system/logs`

Get system activity logs.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**
- `page`, `limit`, `startDate`, `endDate`

**Response (200):**
```json
{
  "logs": [
    {
      "timestamp": "...",
      "level": "info",
      "action": "submission_created",
      "details": { }
    }
  ],
  "pagination": { }
}
```

---

### Get System Stats
**GET** `/system/stats`

Get raw system statistics (users, submissions, memory usage).

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "users": { "total": 250, "active": 240, "inactive": 10 },
  "submissions": { "total": 500, "pending": 50, "processed": 450 },
  "countries": { "total": 195, "active": 150, "inactive": 45 },
  "system": { "uptime": 3600, "memory": { }, "timestamp": "..." }
}
```

---

### Maintain Database
**POST** `/system/maintenance`

Trigger database maintenance tasks (e.g. updating stats, cleaning tokens).

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "message": "Database maintenance completed",
  "results": {
    "timestamp": "...",
    "operations": [ "Updated stats for Ghana", "Cleaned up refresh tokens for 5 users" ]
  }
}
```

---

### Backup Database
**POST** `/system/backup`

Initiate a database backup process.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response (200):**
```json
{
  "timestamp": "...",
  "status": "initiated",
  "message": "Database backup process started",
  "backupId": "backup_1234567890"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'contributor' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Rate Limiting

The API implements rate limiting:
- **100 requests per 15 minutes** per IP address
- Applies to all `/api/*` endpoints

---

## User Roles

### Contributor (Default)
- Submit references
- Update/delete own pending submissions
- View public directory

### Verifier
- All contributor permissions
- Verify submissions for their country
- View pending submissions for their country

### Admin
- All verifier permissions
- Manage all users
- Award badges
- Update user roles
- Deactivate/activate users
- Delete any submission

---

## Gamification System

### Points System
- **Submit reference:** 10 points
- **Reference approved:** 25 points (additional)
- **Verify submission:** 5 points

### Badges
Admins can award custom badges to users for achievements.

---

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
cd backend
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wikisource-verifier
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

5. Start MongoDB:
```bash
mongod
```

6. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "country": "Ghana"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Create Submission:**
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://example.com/article",
    "title": "Test Article",
    "publisher": "Test Publisher",
    "country": "Ghana",
    "category": "secondary"
  }'
```

---

## Support

For issues or questions, please open an issue on the GitHub repository.
