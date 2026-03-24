import { Router } from "express";
import { db } from "../config/supabase.js";
import { userExists, getUserByEmail, getUserById, generateJWT } from "../utils/authUtils.js";
import protectedRoute from "../middleware/protectedRoute.js";
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

  try {
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

    const token = generateJWT(data.id, data.email, data.username);

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

auth.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateJWT(user.id, user.email, user.username);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

auth.get("/profile", protectedRoute, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        sex: user.sex,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default auth;