import dotenv from 'dotenv';

dotenv.config();

// On Toolforge, ToolsDB credentials are provided to the tool as
// TOOL_TOOLSDB_USER / TOOL_TOOLSDB_PASSWORD, and every database name
// must be prefixed with "<user>__".
const toolsdbUser = process.env.TOOL_TOOLSDB_USER;

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  db: {
    // 'mariadb' (ToolsDB / production) or 'sqlite' (tests, quick local runs)
    dialect: process.env.DB_DIALECT || 'mariadb',
    host: process.env.DB_HOST || (toolsdbUser ? 'tools.db.svc.wikimedia.cloud' : '127.0.0.1'),
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || toolsdbUser || 'root',
    password: process.env.DB_PASSWORD || process.env.TOOL_TOOLSDB_PASSWORD || '',
    name: process.env.DB_NAME || (toolsdbUser ? `${toolsdbUser}__sourcewiki` : 'sourcewiki'),
    // sqlite only: file path, or ':memory:'
    storage: process.env.DB_STORAGE || ':memory:',
    logging: process.env.DB_LOGGING === 'true'
  },
  // Development defaults; override in production via environment variables
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
};

export default config;
