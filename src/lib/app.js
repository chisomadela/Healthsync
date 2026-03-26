import e from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import auth from "./routes/authenticationRoutes.js";
import ai from "./routes/aiRoutes.js";
import consultation from "./routes/consultationRoutes.js";
import hospitalCard from "./routes/hospitalCardRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = e();

// ✅ SIMPLE CORS (no stress)
app.use(cors());

// ✅ Body parser
app.use(e.json());

// ✅ Static files
app.use(e.static(path.join(__dirname, "../public")));

// ✅ Routes
app.use("/auth", auth);
app.use("/ai", ai);
app.use("/consultation", consultation);
app.use("/hospital-card", hospitalCard);

app.get("/", (req, res) => {
  return res.json({ message: "Healthsync api running" });
});

app.get("/docs", (req, res) => {
  return res.sendFile(path.join(__dirname, "../public/docs.html"));
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Express Error:", {
    message: err.message,
    path: req.path,
    method: req.method,
  });

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;