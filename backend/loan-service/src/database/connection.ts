import knex from "knex";
import config from "./knexfile";

export const db = knex(config[process.env.NODE_ENV || "development"]);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((err: Error) => {
    console.error('Database connection failed:', err);
  });

export default db;

