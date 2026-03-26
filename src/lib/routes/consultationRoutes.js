import { Router } from "express";
import protectedRoute from "../middleware/protectedRoute.js";
import { getUserById } from "../utils/authUtils.js";
import {
  createConsultation,
  getPendingConsultationsByDoctor,
  getConsultationById,
  endConsultation,
  getConsultationQueueForDoctor,
  getAllConsultationsForDoctor
} from "../utils/consultationUtils.js";
import { getPatientHospitalCard } from "../utils/hospitalCardUtils.js";
import { db } from "../config/supabase.js";

const consultation = Router();

consultation.get("/", async (req, res) => {
  return res.json({ message: "Consultation service running" });
});

/**
 * POST /consultation/create
 * Create a new consultation for a doctor and patient
 * Automatically schedules based on doctor's last consultation
 * 
 * Request body:
 * {
 *   doctor_id: string,
 *   patient_id: string,
 *   description: string (optional),
 *   bufferMinutes: number (optional, default 30)
 * }
 */
consultation.post("/create", protectedRoute, async (req, res) => {
  try {
    const { doctor_id, patient_id, description, bufferMinutes = 30 } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!doctor_id || !patient_id) {
      return res.status(400).json({
        success: false,
        message: "doctor_id and patient_id are required"
      });
    }

    // Get patient details to verify patient exists
    const patient = await getUserById(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Verify patient is actually a patient
    if (patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "User must be a patient to book a consultation"
      });
    }

    // Check if patient has an active hospital card
    const hospitalCard = await getPatientHospitalCard(patient_id);
    if (!hospitalCard) {
      return res.status(403).json({
        success: false,
        message: "Patient must have an active hospital card to book consultations"
      });
    }

    // Get doctor details
    const { data: doctor, error: doctorError } = await db
      .from("doctors")
      .select("*")
      .eq("doctor_id", doctor_id)
      .maybeSingle();

    if (doctorError) {
      console.error("Error fetching doctor:", doctorError);
      return res.status(500).json({
        success: false,
        message: "Error verifying doctor"
      });
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Create the consultation
    const result = await createConsultation({
      doctor_id,
      doctor_fname: `${doctor.first_name} ${doctor.last_name}`,
      patient_fname: `${patient.first_name} ${patient.last_name}`,
      description: description || null,
      bufferMinutes: Math.max(bufferMinutes, 15) // Minimum 15 minutes buffer
    });

    return res.status(201).json({
      success: true,
      message: "Consultation created successfully",
      data: {
        consultation: result.consultation,
        queueInfo: {
          scheduledAfterPreviousConsultation: result.scheduledAfter ? true : false,
          previousConsultationInfo: result.scheduledAfter
        }
      }
    });

  } catch (err) {
    console.error("Create consultation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating consultation"
    });
  }
});

/**
 * POST /consultation/:consultationId/end
 * Mark a consultation as ended (doctor only)
 * 
 * Requires:
 * - User must be a doctor (verified from JWT)
 * - Doctor must own the consultation
 */
consultation.post("/:consultationId/end", protectedRoute, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { doctor_id } = req.body;

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        message: "doctor_id is required"
      });
    }

    // Verify the doctor making the request
    const { data: doctor, error: doctorError } = await db
      .from("doctors")
      .select("*")
      .eq("doctor_id", doctor_id)
      .maybeSingle();

    if (doctorError) {
      console.error("Error fetching doctor:", doctorError);
      return res.status(500).json({
        success: false,
        message: "Error verifying doctor"
      });
    }

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can mark consultations as ended"
      });
    }

    // End the consultation
    const result = await endConsultation(consultationId, doctor_id);

    if (!result.success) {
      return res.status(403).json(result);
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error("End consultation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while ending consultation"
    });
  }
});

/**
 * GET /consultation/doctor/:doctor_id/pending
 * Get all pending consultations for a doctor
 */
consultation.get("/doctor/:doctor_id/pending", protectedRoute, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const consultations = await getPendingConsultationsByDoctor(doctor_id);

    return res.status(200).json({
      success: true,
      data: {
        doctor_id,
        pendingConsultations: consultations,
        count: consultations.length
      }
    });

  } catch (err) {
    console.error("Get pending consultations error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching consultations"
    });
  }
});

/**
 * GET /consultation/doctor/:doctor_id/all
 * Get all consultations for a doctor in chronological order with their statuses
 */
consultation.get("/doctor/:doctor_id/all", protectedRoute, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const consultations = await getAllConsultationsForDoctor(doctor_id);

    // Organize consultations by status
    const organized = {
      pending: consultations.filter(c => c.status === 'pending'),
      ongoing: consultations.filter(c => c.status === 'ongoing'),
      ended: consultations.filter(c => c.status === 'ended')
    };

    return res.status(200).json({
      success: true,
      data: {
        doctor_id,
        summary: {
          total: consultations.length,
          pending: organized.pending.length,
          ongoing: organized.ongoing.length,
          ended: organized.ended.length
        },
        allConsultations: consultations,
        byStatus: organized
      }
    });

  } catch (err) {
    console.error("Get all consultations error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching consultations"
    });
  }
});

/**
 * GET /consultation/doctor/:doctor_id/queue
 * Get the consultation queue for a doctor (all pending and ongoing consultations)
 */
consultation.get("/doctor/:doctor_id/queue", protectedRoute, async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const queue = await getConsultationQueueForDoctor(doctor_id);

    return res.status(200).json({
      success: true,
      data: {
        doctor_id,
        consultationQueue: queue,
        count: queue.length
      }
    });

  } catch (err) {
    console.error("Get consultation queue error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching consultation queue"
    });
  }
});

/**
 * GET /consultation/:consultationId
 * Get a specific consultation by ID
 */
consultation.get("/:consultationId", protectedRoute, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultationData = await getConsultationById(consultationId);

    if (!consultationData) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: consultationData
    });

  } catch (err) {
    console.error("Get consultation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching consultation"
    });
  }
});

/**
 * GET /consultation/patient/:patient_id/consultations
 * Get all consultations for a patient
 */
consultation.get("/patient/:patient_id/consultations", protectedRoute, async (req, res) => {
  try {
    const { patient_id } = req.params;

    // Verify patient exists
    const patient = await getUserById(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "User must be a patient"
      });
    }

    // Get all consultations for this patient
    const { data: consultations, error } = await db
      .from("consultation")
      .select("*")
      .eq("patient_fname", `${patient.first_name} ${patient.last_name}`)
      .order("consultation_time", { ascending: false });

    if (error) {
      console.error("Error fetching patient consultations:", error);
      throw error;
    }

    // Organize by status
    const organized = {
      pending: consultations.filter(c => c.status === 'pending'),
      ongoing: consultations.filter(c => c.status === 'ongoing'),
      ended: consultations.filter(c => c.status === 'ended')
    };

    return res.status(200).json({
      success: true,
      data: {
        patient_id,
        summary: {
          total: consultations.length,
          pending: organized.pending.length,
          ongoing: organized.ongoing.length,
          ended: organized.ended.length
        },
        allConsultations: consultations,
        byStatus: organized
      }
    });

  } catch (err) {
    console.error("Get patient consultations error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching consultations"
    });
  }
});

export default consultation;
