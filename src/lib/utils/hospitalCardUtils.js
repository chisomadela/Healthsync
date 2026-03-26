import { db } from "../config/supabase.js";

/**
 * Create/Purchase a hospital card for a patient
 */
async function purchaseHospitalCard(patient_id) {
  try {
    // Check if patient already has an active hospital card
    const { data: existingCard, error: checkError } = await db
      .from("hospital_cards")
      .select("*")
      .eq("patient_id", patient_id)
      .eq("status", "active")
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingCard) {
      return {
        success: false,
        message: "Patient already has an active hospital card"
      };
    }

    // Create new hospital card
    const { data, error } = await db
      .from("hospital_cards")
      .insert([
        {
          patient_id,
          status: "active",
          purchased_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year validity
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating hospital card:", error);
      throw error;
    }

    return {
      success: true,
      message: "Hospital card purchased successfully",
      card: data
    };
  } catch (err) {
    console.error("Error in purchaseHospitalCard:", err);
    throw err;
  }
}

/**
 * Get patient's hospital card
 */
async function getPatientHospitalCard(patient_id) {
  try {
    const { data, error } = await db
      .from("hospital_cards")
      .select("*")
      .eq("patient_id", patient_id)
      .eq("status", "active")
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Error in getPatientHospitalCard:", err);
    throw err;
  }
}

/**
 * Check if patient can book consultations (has active hospital card)
 */
async function canPatientBookConsultation(patient_id) {
  try {
    const card = await getPatientHospitalCard(patient_id);
    return !!card;
  } catch (err) {
    console.error("Error in canPatientBookConsultation:", err);
    return false;
  }
}

/**
 * Get doctor's default consultation fee
 */
async function getDoctorConsultationFee(doctor_id) {
  try {
    const { data, error } = await db
      .from("doctors")
      .select("consultation_fee")
      .eq("doctor_id", doctor_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.consultation_fee || 0;
  } catch (err) {
    console.error("Error in getDoctorConsultationFee:", err);
    return 0;
  }
}

/**
 * Record consultation payment (placeholder - no actual payment processing)
 */
async function recordConsultationPayment(consultation_id, doctor_id, patient_id, amount) {
  try {
    const { data, error } = await db
      .from("consultation_payments")
      .insert([
        {
          consultation_id,
          doctor_id,
          patient_id,
          amount,
          status: "completed",
          payment_method: "placeholder",
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error recording payment:", error);
      throw error;
    }

    return {
      success: true,
      payment: data
    };
  } catch (err) {
    console.error("Error in recordConsultationPayment:", err);
    throw err;
  }
}

/**
 * Get patient's consultation history
 */
async function getPatientConsultations(patient_id) {
  try {
    const { data, error } = await db
      .from("consultation")
      .select("*")
      .eq("patient_fname", (await getUserNameById(patient_id)))
      .order("consultation_time", { ascending: false });

    if (error) {
      console.error("Error fetching patient consultations:", error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error("Error in getPatientConsultations:", err);
    return [];
  }
}

/**
 * Get user full name by ID (helper)
 */
async function getUserNameById(user_id) {
  try {
    const { data: user, error } = await db
      .from("users")
      .select("first_name, last_name")
      .eq("id", user_id)
      .maybeSingle();

    if (error || !user) return "";
    return `${user.first_name} ${user.last_name}`;
  } catch (err) {
    console.error("Error in getUserNameById:", err);
    return "";
  }
}

export {
  purchaseHospitalCard,
  getPatientHospitalCard,
  canPatientBookConsultation,
  getDoctorConsultationFee,
  recordConsultationPayment,
  getPatientConsultations,
  getUserNameById
};
