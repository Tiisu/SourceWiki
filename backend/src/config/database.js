import { Sequelize } from 'sequelize';
import config from './config.js';

const { db } = config;

export const sequelize = db.dialect === 'sqlite'
  ? new Sequelize({
      dialect: 'sqlite',
      storage: db.storage,
      logging: db.logging ? console.log : false
    })
  : new Sequelize(db.name, db.user, db.password, {
      dialect: 'mariadb',
      host: db.host,
      port: db.port,
      logging: db.logging ? console.log : false,
      // Read and write DATETIMEs as UTC regardless of the server timezone
      timezone: '+00:00',
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      },
      pool: { max: 5, min: 0, idle: 10000 }
    });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // Create any missing tables. Never drops or alters existing ones.
    await sequelize.sync();

    const where = db.dialect === 'sqlite' ? db.storage : `${db.host}/${db.name}`;
    console.log(`Database connected successfully: ${db.dialect} ${where}`);

    process.on('SIGINT', async () => {
      await sequelize.close();
      console.log('Database connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
