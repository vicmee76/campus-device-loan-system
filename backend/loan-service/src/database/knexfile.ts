import type { Knex } from "knex";
import dotenv from "dotenv";
dotenv.config();

// SSL configuration for Aiven PostgreSQL (private CA)
// rejectUnauthorized: false allows self-signed certificates from Aiven's private CA
const sslConfig = {
  rejectUnauthorized: false
};

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    }
  },
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    }
  }
};

export default config;
