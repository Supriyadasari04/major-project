import { pool } from "../config/db";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

export const signup = async (req: any, res: any) => {
  console.log("SIGNUP HIT");
  console.log("BODY:", req.body);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuid();
    const createdAt = new Date();

    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, created_at`,
      [id, name, email, hashedPassword, createdAt]
    );

    console.log("USER INSERTED:", result.rows[0]);

    const row = result.rows[0];
res.status(201).json({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.created_at,
});

  } catch (error: any) {
    console.error("SIGNUP ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};


export const login = async (req: any, res: any) => {
  const { email, password } = req.body;

  console.log("LOGIN HIT", email);

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  });
};

