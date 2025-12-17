import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

// Force NODE_TLS_REJECT_UNAUTHORIZED=0 to allow self-signed certificates
// This is safe for Aiven PostgreSQL with private CA
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;
