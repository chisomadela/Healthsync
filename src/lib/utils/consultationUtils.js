import { db } from "../config/supabase.js";

/**
 * Get the last consultation for a doctor
 */
async function getLastConsultationByDoctorId(doctor_id) {
  const { data, error } = await db
    .from("consultation")
    .select("*")
    .eq("doctor_id", doctor_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching last consultation:", error);
    throw error;
  }

  return data;
}

/**
 * Calculate the next consultation time based on the last one
 * Adds a buffer time (e.g., 30 minutes) to the last consultation's end time
 */
function calculateNextConsultationTime(lastConsultation, bufferMinutes = 30) {
  if (!lastConsultation || !lastConsultation.consultation_time) {
    // If no last consultation, use current time
    const now = new Date();
    return new Date(now.getTime() + bufferMinutes * 60000); // Add buffer minutes
  }

  const lastConsultationTime = new Date(lastConsultation.consultation_time);
  // Add buffer minutes to schedule the next consultation
  const nextTime = new Date(lastConsultationTime.getTime() + bufferMinutes * 60000);
  return nextTime;
}

/**
 * Create a new consultation
 */
async function createConsultation({
  doctor_id,
  doctor_fname,
  patient_fname,
  description,
  bufferMinutes = 30
}) {
  try {
    // Get the last consultation for this doctor
    const lastConsultation = await getLastConsultationByDoctorId(doctor_id);

    // Calculate next consultation time
    const nextConsultationTime = calculateNextConsultationTime(lastConsultation, bufferMinutes);
    
    // Get the consultation date (just the date part)
    const consultationDate = new Date(nextConsultationTime);
    consultationDate.setHours(0, 0, 0, 0); // Reset to start of day

    // Create the consultation
    const { data, error } = await db
      .from("consultation")
      .insert([
        {
          doctor_id,
          doctor_fname,
          patient_fname,
          description,
          consultation_time: nextConsultationTime.toISOString(),
          consultation_date: consultationDate.toISOString().split('T')[0], // YYYY-MM-DD format
          status: "pending"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating consultation:", error);
      throw error;
    }

    return {
      success: true,
      consultation: data,
      scheduledAfter: lastConsultation ? {
        consultationId: lastConsultation.id,
        previousTime: lastConsultation.consultation_time
      } : null
    };
  } catch (err) {
    console.error("Error in createConsultation:", err);
    throw err;
  }
}

/**
 * Get all pending consultations for a doctor
 */
async function getPendingConsultationsByDoctor(doctor_id) {
  const { data, error } = await db
    .from("consultation")
    .select("*")
    .eq("doctor_id", doctor_id)
    .eq("status", "pending")
    .order("consultation_time", { ascending: true });

  if (error) {
    console.error("Error fetching pending consultations:", error);
    throw error;
  }

  return data;
}

/**
 * Get consultation by ID
 */
async function getConsultationById(consultationId) {
  const { data, error } = await db
    .from("consultation")
    .select("*")
    .eq("id", consultationId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching consultation:", error);
    throw error;
  }

  return data;
}

/**
 * Mark consultation as ended
 */
async function endConsultation(consultationId, doctor_id) {
  try {
    const consultation = await getConsultationById(consultationId);

    if (!consultation) {
      return {
        success: false,
        message: "Consultation not found"
      };
    }

    // Verify the doctor owns this consultation
    if (consultation.doctor_id !== doctor_id) {
      return {
        success: false,
        message: "Unauthorized: You can only end your own consultations"
      };
    }

    // Update the consultation status to ended
    const { data, error } = await db
      .from("consultation")
      .update({ status: "ended" })
      .eq("id", consultationId)
      .select()
      .single();

    if (error) {
      console.error("Error ending consultation:", error);
      throw error;
    }

    return {
      success: true,
      message: "Consultation marked as ended",
      consultation: data
    };
  } catch (err) {
    console.error("Error in endConsultation:", err);
    throw err;
  }
}

/**
 * Get consultation queue for a doctor
 */
async function getConsultationQueueForDoctor(doctor_id) {
  try {
    const { data, error } = await db
      .from("consultation")
      .select("*")
      .eq("doctor_id", doctor_id)
      .in("status", ["pending", "ongoing"])
      .order("consultation_time", { ascending: true });

    if (error) {
      console.error("Error fetching consultation queue:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Error in getConsultationQueueForDoctor:", err);
    throw err;
  }
}

/**
 * Get all consultations for a doctor (regardless of status)
 */
async function getAllConsultationsForDoctor(doctor_id) {
  try {
    const { data, error } = await db
      .from("consultation")
      .select("*")
      .eq("doctor_id", doctor_id)
      .order("consultation_time", { ascending: true });

    if (error) {
      console.error("Error fetching all consultations:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Error in getAllConsultationsForDoctor:", err);
    throw err;
  }
}

export {
  getLastConsultationByDoctorId,
  calculateNextConsultationTime,
  createConsultation,
  getPendingConsultationsByDoctor,
  getConsultationById,
  endConsultation,
  getConsultationQueueForDoctor,
  getAllConsultationsForDoctor
};
