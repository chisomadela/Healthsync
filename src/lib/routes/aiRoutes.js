import { Router } from "express";
import protectedRoute from "../middleware/protectedRoute.js";
import { recommendDoctorAI } from "../utils/aiUtils.js";
import { getUserById } from "../utils/authUtils.js";

const ai = Router();

ai.get("/", async (req, res) => {
  return res.json({ message: "AI service running" });
});

ai.post("/aiRecommendation", protectedRoute, async (req, res) => {
  try {
    const { symptoms } = req.body;
    const userId = req.user.userId;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Symptoms field is required and must be a non-empty string"
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available for patients. Doctors cannot request doctor recommendations."
      });
    }

    const recommendation = await recommendDoctorAI(symptoms);

    if (!recommendation.success) {
      return res.status(500).json({
        success: false,
        message: recommendation.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor recommendation generated successfully",
      patient: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email
      },
      symptoms: symptoms,
      recommendation: recommendation.recommendation,
      reasoning: recommendation.reasoning
    });

  } catch (err) {
    console.error("AI Recommendation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing recommendation"
    });
  }
});

export default ai;