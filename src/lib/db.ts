import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured. Please set DATABASE_URL to your Neon connection string.");
  }
  return neon(url);
}

export type SqlClient = ReturnType<typeof getSql>;