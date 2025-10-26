# WikiMake Server

Express.js backend server for the WikiMake application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your environment variables (see `.env` for template)

3. Start the development server:
   ```bash
   npm run dev
   ```

   Or start the production server:
   ```bash
   npm start
   ```

## Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information endpoint

## Development

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload
- `npm test` - Run tests (not implemented yet)

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **morgan** - HTTP request logger
- **dotenv** - Environment variable loader

## Development Dependencies

- **nodemon** - Auto-restart server during development