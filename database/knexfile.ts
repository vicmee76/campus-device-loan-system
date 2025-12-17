// Load environment variables from .env file in the database folder
// If dotenv is not installed, environment variables must be set directly
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch (e) {
  // dotenv not available, rely on environment variables being set in the shell
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Please set it in database/.env file or export it.');
}

export default {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" }
  },
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" }
  }
};

