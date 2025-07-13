import type { Config } from "drizzle-kit";
import 'dotenv/config'

export default {
  schema: "./src/schemas/*",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
  },
} satisfies Config;