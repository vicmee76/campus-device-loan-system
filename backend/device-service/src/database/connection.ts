import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Database configuration
const dbConfig: Knex.Config = {
  client: process.env.DB_CLIENT || 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string),
    database: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'migrations'),
  },
};

const db: Knex = knex(dbConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((err: Error) => {
    console.error('Database connection failed:', err);
  });

export default db;

