import { Router } from "express";
import { db } from "../config/supabase.js";
import { userExists } from "../utils/authUtils.js";
import bcrypt from "bcrypt";

const auth = Router();

auth.get("/", async (req, res) => {
  return res.json({ message: "auth service running" });
});

auth.post("/signup", async (req, res) => {
  const {
    email,
    username,
    password,
    first_name,
    last_name,
    middle_name,
    phone,
    date_of_birth,
    sex,
    address,
    role,
  } = req.body;

  if (
    !email ||
    !username ||
    !password ||
    !first_name ||
    !last_name ||
    !phone ||
    !date_of_birth ||
    !sex ||
    !address ||
    !role
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (role !== "patient" && role !== "doctor") {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (await userExists(email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await db
    .from("users")
    .insert([
      {
        email,
        username,
        password: hashedPassword,
        first_name,
        last_name,
        middle_name,
        phone,
        date_of_birth,
        role,
        sex,
        address,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error inserting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

  return res
    .status(201)
    .json({ message: "User created successfully", user: data });
});

export default auth;