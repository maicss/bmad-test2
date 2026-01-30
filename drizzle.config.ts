import type { Config } from "drizzle-kit";

export default {
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  dbCredentials: {
    url: "database/db.sqlite",
  },
  out: "./database/migrations",
  strict: true,
  verbose: true,
  // Better-Auth 与 Drizzle 的兼容性配置
  tablesFilter: ["!sqlite_sequence"],
} satisfies Config;
