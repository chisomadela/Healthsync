import { Router } from "express";
import { db } from "../config/supabase.js";
import { userExists, getUserByEmail, getUserById, generateJWT, getDoctorByEmail, getDoctorByDoctorId, generateDoctorJWT } from "../utils/authUtils.js";
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

  // Validation: Check for missing fields
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

  // Validation: Check role
  if (role !== "patient" && role !== "doctor") {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Validation: Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Validation: Check password length
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Check for existing email
  if (await userExists(email)) {
    return res.status(409).json({ message: "Email already registered" });
  }

  // Check for existing username
  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existingUser) {
    return res.status(409).json({ message: "Username already taken" });
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
      console.error("❌ Error inserting user:", error);
      
      // Handle specific database constraint errors
      if (error.code === "23505") {
        if (error.details.includes("email")) {
          return res.status(409).json({ message: "Email already registered" });
        } else if (error.details.includes("username")) {
          return res.status(409).json({ message: "Username already taken" });
        }
      }
      
      return res.status(500).json({ message: "Failed to create account. Please try again." });
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
    console.error("❌ Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

auth.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!email.trim() || !password.trim()) {
    return res.status(400).json({ message: "Email and password cannot be empty" });
  }

  try {
    const user = await getUserByEmail(email.trim());

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
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
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

auth.post("/logout", protectedRoute, async (req, res) => {
  try {
    return res.status(200).json({
      message: "Logout successful. Please remove the token from client storage.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

auth.post("/doctor-login", async (req, res) => {
  const { doctor_id, email, password } = req.body;

  // Validation
  if (!password || (!doctor_id && !email)) {
    return res.status(400).json({
      message: "Password is required. Please provide either Doctor ID or email.",
    });
  }

  if (!password.trim()) {
    return res.status(400).json({ message: "Password cannot be empty" });
  }

  try {
    let doctor;

    if (doctor_id) {
      if (!doctor_id.trim()) {
        return res.status(400).json({ message: "Doctor ID cannot be empty" });
      }
      doctor = await getDoctorByDoctorId(doctor_id.trim());
    } else {
      if (!email.trim()) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      doctor = await getDoctorByEmail(email.trim());
    }

    if (!doctor) {
      return res
        .status(401)
        .json({ message: "Invalid Doctor ID/email or password" });
    }

    // Compare password - check if it's hashed or plain
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, doctor.password);
    } catch {
      // Fallback for plain text comparison (for testing/migration)
      isPasswordValid = password === doctor.password;
    }

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid Doctor ID/email or password" });
    }

    const token = generateDoctorJWT(doctor);

    return res.status(200).json({
      message: "Doctor login successful",
      doctor: {
        id: doctor.id || doctor.doctor_id,
        doctor_id: doctor.doctor_id,
        email: doctor.email,
        username: doctor.username || doctor.email,
        first_name: doctor.first_name || "",
        last_name: doctor.last_name || "",
        specialty: doctor.specialty,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Doctor login error:", err);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

export default auth;