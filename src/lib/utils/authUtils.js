import { db } from "../config/supabase.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";

async function userExists(email) {
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error checking user existence:", error);
    throw error;
  }

  return !!data;
}

async function getUserByEmail(email) {
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user:", error);
    throw error;
  }

  return data;
}

async function getUserById(id) {
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user:", error);
    throw error;
  }

  return data;
}

function generateJWT(userId, email, username) {
  const token = jwt.sign(
    { userId, email, username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return token;
}

export { userExists, getUserByEmail, getUserById, generateJWT };