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

// SSL configuration for Aiven PostgreSQL (private CA)
// rejectUnauthorized: false allows self-signed certificates from Aiven's private CA
const sslConfig = {
  rejectUnauthorized: false
};

const baseConfig = {
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  },
  migrations: { directory: "./migrations" },
  seeds: { directory: "./seeds" }
};

export default {
  development: baseConfig,
  production: baseConfig
};
