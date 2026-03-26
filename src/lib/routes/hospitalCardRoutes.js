import { Router } from "express";
import protectedRoute from "../middleware/protectedRoute.js";
import { getUserById } from "../utils/authUtils.js";
import {
  purchaseHospitalCard,
  getPatientHospitalCard,
  canPatientBookConsultation,
  getDoctorConsultationFee,
  recordConsultationPayment
} from "../utils/hospitalCardUtils.js";

const hospitalCard = Router();

hospitalCard.get("/", async (req, res) => {
  return res.json({ message: "Hospital card service running" });
});

/**
 * POST /hospital-card/purchase
 * Patient purchases a hospital card
 * Placeholder payment - just pretend payment is processed
 */
hospitalCard.post("/purchase", protectedRoute, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user is a patient
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can purchase hospital cards"
      });
    }

    // Purchase the hospital card
    const result = await purchaseHospitalCard(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: "Hospital card purchased successfully",
      data: result.card
    });

  } catch (err) {
    console.error("Purchase hospital card error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while purchasing hospital card"
    });
  }
});

/**
 * GET /hospital-card/status
 * Check if patient has an active hospital card
 */
hospitalCard.get("/status", protectedRoute, async (req, res) => {
  try {
    const userId = req.user.userId;

    const card = await getPatientHospitalCard(userId);

    return res.status(200).json({
      success: true,
      data: {
        has_active_card: !!card,
        card: card || null
      }
    });

  } catch (err) {
    console.error("Get hospital card status error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while checking hospital card status"
    });
  }
});

/**
 * POST /hospital-card/payment-placeholder
 * Placeholder endpoint for payment processing
 * In production, this would integrate with a real payment gateway
 */
hospitalCard.post("/payment-placeholder", protectedRoute, async (req, res) => {
  try {
    const { amount, type } = req.body; // type: 'hospital_card' or 'consultation'
    const userId = req.user.userId;

    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: "amount and type are required"
      });
    }

    // Placeholder: Just simulate successful payment
    return res.status(200).json({
      success: true,
      message: "Payment placeholder processed successfully",
      data: {
        payment_id: `PLACEHOLDER_${Date.now()}`,
        amount,
        type,
        status: "completed",
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("Payment placeholder error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing payment"
    });
  }
});

export default hospitalCard;
