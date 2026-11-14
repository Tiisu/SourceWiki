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
- **Backend**: Node.js + Express, MariaDB (via Sequelize), JWT Authentication
- **Hosting**: [Toolforge](https://wikitech.wikimedia.org/wiki/Help:Toolforge), with data in ToolsDB (MariaDB)
- **Development**: Hot reload, ESM modules, modern tooling

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v24+ recommended)
- **npm** (comes with Node.js)
- **MariaDB** (local installation), or use the built-in SQLite mode for quick local runs
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

#### MariaDB
```bash
# macOS (Homebrew)
brew install mariadb
brew services start mariadb

# Ubuntu / Debian
sudo apt install mariadb-server

# Create the database
mariadb -u root -e "CREATE DATABASE sourcewiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

No MariaDB? Set `DB_DIALECT=sqlite` and `DB_STORAGE=./dev.sqlite` in `backend/.env`
and the backend stores everything in a local file instead (run `npm install sqlite3` in
`backend/` first). Tables are created automatically on startup.

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

# Database (MariaDB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sourcewiki

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

**Frontend Environment Variables** (optional):
```env
# Defaults to /api. The Vite dev server forwards /api to http://localhost:5000.
VITE_API_URL=/api
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
│   │   ├── models/         # Sequelize models (MariaDB)
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

### Database

The backend uses MariaDB through [Sequelize](https://sequelize.org/). Tables are
created automatically on startup (`sequelize.sync()`); existing tables are never
dropped or altered, so schema changes to existing tables need a manual
`ALTER TABLE`.

On Toolforge the database is ToolsDB. See [Deploying to Toolforge](#-deploying-to-toolforge).

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5000 |
| `DB_HOST` / `DB_PORT` | MariaDB server | 127.0.0.1 / 3306 |
| `DB_USER` / `DB_PASSWORD` | MariaDB credentials | root / (empty) |
| `DB_NAME` | Database name | sourcewiki |
| `DB_DIALECT` | `mariadb` or `sqlite` | mariadb |
| `JWT_SECRET` | Secret for JWT tokens | Change in production |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `TRUST_PROXY` | Set to `1` behind a reverse proxy (Toolforge) | unset |
| `ANON_RATE_LIMIT_MAX` | Requests per 15 min for logged-out visitors | 50 |
| `VITE_API_URL` | Backend API URL | /api |

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

## 🚀 Deploying to Toolforge

The app runs on Toolforge as a single web service: Express serves the API under
`/api` and the built React app for every other path. It is built from the
GitLab mirror with the Toolforge Build Service (`package.json` and `Procfile` at
the repo root).

**One-time setup** (on `login.toolforge.org`):
```bash
become sourcewiki

# Create the ToolsDB database. Its name must start with the tool's DB user
# (the "user = s12345" line in ~/replica.my.cnf), e.g. s12345__sourcewiki
grep user ~/replica.my.cnf
mariadb --defaults-file=$HOME/replica.my.cnf -h tools.db.svc.wikimedia.cloud
#   MariaDB> CREATE DATABASE s12345__sourcewiki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#   MariaDB> exit

# Secrets and settings (each command prompts for the value)
toolforge envvars create JWT_SECRET            # long random string
toolforge envvars create JWT_REFRESH_SECRET    # a different long random string
toolforge envvars create NODE_ENV              # production
toolforge envvars create FRONTEND_URL          # https://sourcewiki.toolforge.org
toolforge envvars create TRUST_PROXY           # 1
toolforge envvars create ANON_RATE_LIMIT_MAX   # e.g. 2000
```

ToolsDB credentials come from the `TOOL_TOOLSDB_USER` / `TOOL_TOOLSDB_PASSWORD`
variables Toolforge provides, and the database name defaults to
`<user>__sourcewiki`. Check they exist with `toolforge envvars list`; if not, set
`DB_USER` / `DB_PASSWORD` from `~/replica.my.cnf`.

**Deploy / update:**
```bash
toolforge build start https://gitlab.wikimedia.org/toolforge-repos/sourcewiki.git
toolforge webservice buildservice start --mount=none   # first time
toolforge webservice restart                           # later deploys
toolforge webservice logs -f                           # "Database connected successfully"
```

The site is served at https://sourcewiki.toolforge.org.

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```

#### Database Connection Issues
- Ensure MariaDB is running: `brew services list | grep mariadb` or `systemctl status mariadb`
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` in `.env`
- Make sure the database exists (see the `CREATE DATABASE` command above)

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
