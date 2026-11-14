import { sequelize } from '../src/config/database.js';
// Import the models so they are registered before sync()
import '../src/models/User.js';
import '../src/models/Submission.js';
import '../src/models/CountryStats.js';

// Fresh schema for each test file
beforeAll(async () => {
  await sequelize.sync({ force: true });
}, 120000);

// Empty every table after each test
afterEach(async () => {
  for (const model of Object.values(sequelize.models)) {
    await model.destroy({ where: {}, truncate: true, force: true });
  }
});

afterAll(async () => {
  await sequelize.close();
}, 30000);
