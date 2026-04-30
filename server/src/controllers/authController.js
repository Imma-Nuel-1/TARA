import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const hashedAdminPassword = bcrypt.hashSync(env.adminPassword, 10);

export async function adminLogin(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const expectedUsername = String(env.adminUsername).trim().toLowerCase();

  if (normalizedUsername !== expectedUsername) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, hashedAdminPassword);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { role: "admin", username: expectedUsername },
    env.jwtSecret,
    {
      expiresIn: "30d",
    },
  );

  return res.json({ token, username: expectedUsername });
}
