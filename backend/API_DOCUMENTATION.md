# WikiSource Verifier API Documentation

## Base URL
```
http://localhost:5000/api
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
  "fileType": "url"
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
  "verifierNotes": "Credible government source with proper citations"
}
```

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
