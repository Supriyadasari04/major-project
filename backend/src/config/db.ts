import { Pool } from "pg";

export const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "postgres123",
  database: "justly_db",
  port: 5432,
});
