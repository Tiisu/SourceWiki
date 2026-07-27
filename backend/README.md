# WikiSourceVerifier Backend

Backend API for the WikiSourceVerifier platform — a community-driven reference verification tool for Wikipedia editors and Wikimedia contributors.

## Overview

WikiSourceVerifier provides a REST API for crowdsourcing and curating credible, country-based reference databases that support better citation practices on Wikipedia.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit, xss, cookie-parser
- **File Uploads**: Multer
- **Logging**: Morgan
- **Testing**: Jest + Supertest + mongodb-memory-server

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas (User, Submission, CountryStats)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── tests/               # Jest test suite
├── package.json
└── README.md
```

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the `backend` directory:

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
```

## Running the Server

```bash
# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000` by default. All routes are mounted under `/api`.

## API Endpoints

### Auth — `/api/auth`
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `POST /api/auth/logout` — Logout (auth required)
- `GET /api/auth/me` — Get current user (auth required)
- `POST /api/auth/refresh` — Refresh access token
- `PUT /api/auth/profile` — Update profile (auth required)
- `PUT /api/auth/password` — Change password (auth required)

### Submissions — `/api/submissions`
- `GET /api/submissions` — List all submissions
- `POST /api/submissions` — Create submission (auth required)
- `GET /api/submissions/stats` — Get submission statistics
- `GET /api/submissions/my/submissions` — Get current user's submissions (auth required)
- `GET /api/submissions/pending/country` — Pending queue for country (verifier/admin)
- `GET /api/submissions/:id` — Get single submission
- `PUT /api/submissions/:id` — Update submission (auth required)
- `DELETE /api/submissions/:id` — Delete submission (auth required)
- `PUT /api/submissions/:id/verify` — Verify/reject submission (verifier/admin)

### Users — `/api/users`
- `GET /api/users/leaderboard` — Global leaderboard
- `GET /api/users` — List all users (admin only)
- `GET /api/users/:id` — Get user profile
- `POST /api/users/:id/badge` — Award badge (admin only)
- `PUT /api/users/:id/role` — Update user role (admin only)
- `PUT /api/users/:id/deactivate` — Deactivate user (admin only)
- `PUT /api/users/:id/activate` — Activate user (admin only)

### Countries — `/api/countries`
- `GET /api/countries` — List countries
- `GET /api/countries/:code/stats` — Country statistics
- `GET /api/countries/:code/submissions` — Submissions by country
- `POST /api/countries` — Create country
- `PUT /api/countries/:code` — Update country
- `DELETE /api/countries/:code` — Delete country
- `POST /api/countries/:code/update-stats` — Recalculate country stats
- `POST /api/countries/:code/assign-verifier` — Assign verifier to country
- `POST /api/countries/:code/remove-verifier` — Remove verifier from country

### Admin — `/api/admin`
- `GET /api/admin/dashboard` — Admin dashboard summary
- `GET /api/admin/analytics` — Platform analytics
- `GET /api/admin/users` — List users
- `PUT /api/admin/users/:id` — Update user
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/submissions` — List submissions
- `PUT /api/admin/submissions/:id/override` — Override submission status
- `DELETE /api/admin/submissions/:id` — Delete submission

### Reports — `/api/reports`
- `GET /api/reports/overview` — Overview report
- `GET /api/reports/country/:country` — Country-specific report
- `GET /api/reports/user/:userId` — User-specific report

### System — `/api/system`
- `GET /api/system/health` — Health check
- `GET /api/system/logs` — System logs
- `GET /api/system/stats` — System statistics
- `POST /api/system/maintenance` — Trigger DB maintenance
- `POST /api/system/backup` — Trigger DB backup

## Database Models

- **User** — Accounts, roles, points, badges
- **Submission** — Submitted references with verification status
- **CountryStats** — Aggregated per-country statistics

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- HTTP-only cookies
- CORS protection
- Rate limiting on `/api/` routes
- Helmet security headers
- Input validation via express-validator
- XSS protection

## Testing

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode
```

## Additional Documentation

- Full API reference: see `API_DOCUMENTATION.md`
- Commit conventions: see `COMMIT_MESSAGE.md`

## License

MIT