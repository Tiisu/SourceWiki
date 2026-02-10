# WikiSourceVerifier

A community-driven reference verification platform for Wikipedia editors and Wikimedia contributors.

## 🎯 Project Overview

WikiSourceVerifier helps Wikipedia editors crowdsource and curate credible, country-based reference databases to support better citation practices on Wikipedia.

### Key Features
- **Reference Submission**: Submit URLs, PDFs, or other references for verification
- **Country-based Verification**: Local experts review sources relevant to their region
- **Public Directory**: Searchable database of verified credible sources
- **Community Metrics**: Gamification with points, badges, and leaderboards

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, MongoDB, JWT Authentication
- **Development**: Hot reload, ESM modules, modern tooling

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

### Installing Prerequisites

#### Node.js & npm
```bash
# Check if already installed
node --version


# If not installed, download from https://nodejs.org/
# Or use a version manager like nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24
nvm use 24
```

#### MongoDB
```bash
# Local installation (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd wikisource-verifier
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/wikisource-verifier

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit frontend environment
nano .env
```

**Frontend Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (see backend/API_DOCUMENTATION.md)

## 🛠️ Development

### Available Scripts

#### Backend Scripts
```bash
npm run dev      # Start development server with hot reload
npm start        # Start production server
npm test         # Run tests (not implemented yet)
```

#### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Project Structure

```
wikisource-verifier/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Authentication & validation
│   │   ├── config/         # Database configuration
│   │   └── server.js       # Express app entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client & utilities
│   │   └── styles/        # CSS files
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🔧 Configuration

### MongoDB Setup Options

#### Option 1: Local MongoDB
```bash
# Start local MongoDB
mongod --dbpath /usr/local/var/mongodb

# Or with brew services
brew services start mongodb-community
```

#### Option 2: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | Local MongoDB |
| `JWT_SECRET` | Secret for JWT tokens | Change in production |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

## 🧪 Testing

### Manual Testing
1. Start both backend and frontend servers
2. Open http://localhost:5173
3. Test user registration, login, submission workflow

### API Testing
```bash
# Test server health
curl http://localhost:5000/api/health

# Test authentication endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"contributor"}'
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

#### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services list | grep mongodb`
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

#### npm Install Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Frontend Build Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Additional Resources

- [API Documentation](backend/API_DOCUMENTATION.md)
- [Frontend Guidelines](frontend/src/guidelines/Guidelines.md)
- [Contributing Guidelines](#) (TODO)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🌍 Project Vision

### Core Features

#### 1. Reference Submission Form
Simple web form where contributors can:
- Paste a URL or upload a reference (e.g., PDF, DOI, book info)
- Select the country of origin
- Suggest a category:
  - 📗 Primary source (firsthand/original data)
  - 📘 Secondary source (reporting or analysis)
  - 🚫 Not reliable (blog, misinformation, biased source)
- Optionally link the Wikipedia article where it was used

#### 2. Verification Dashboard (Country Admins)
Each country has assigned verifiers (e.g., Wikimedia community members, editors, librarians) who can:
- Review pending submissions
- Mark as "Credible" / "Unreliable"
- Reassign or flag for global review
- Add short notes ("Owned by government", "Academic publisher", etc.)

#### 3. Public Reference Directory
A searchable and filterable list of verified sources:
- Filter by Country, Category, Reliability, or Type of Media
- API endpoint for external tools (so editors can integrate it into Wikipedia citation templates or gadgets)
- Each entry includes: Title/Publisher, URL/DOI, Country, Reliability category, Date verified, Verifier name (optional)

#### 4. Gamification / Community Metrics
- Contributors earn points or badges for verified submissions
- Country dashboards show leaderboards for engagement

### Example User Flow
1. A contributor finds a source while editing a Wikipedia article
2. They visit WikiSourceVerifier.org
3. Submit the link + select "Ghana" + mark it as "Secondary"
4. A Ghanaian admin reviews it → marks "Credible"
5. It appears in the public "Ghana - Verified Sources" list
6. Other editors now know it's a trustworthy source

### Benefits for the Wikimedia Movement
- Reduces the spread of unreliable sources on Wikipedia
- Encourages cross-country collaboration for credible referencing
- Supports smaller language Wikipedias with localized reference vetting
- Creates an open dataset of verified credible references per country
