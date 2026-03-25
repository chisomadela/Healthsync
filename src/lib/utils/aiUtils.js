import { db } from '../config/supabase.js';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

export async function getAllDoctors() {
  try {
    const { data, error } = await db
      .from('doctors')
      .select('*');
    
    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to fetch doctors:', err);
    return [];
  }
}

export async function recommendDoctorAI(patientSymptoms) {
  try {
    const doctors = await getAllDoctors();
    
    if (doctors.length === 0) {
      return {
        success: false,
        message: 'No doctors available in the database',
        recommendation: null,
        reasoning: null
      };
    }

    const doctorsList = doctors.map(doctor => `
ID: ${doctor.doctor_id}
Name: Dr. ${doctor.doctor_fname} ${doctor.doctor_lname}
Department: ${doctor.doctor_department}
Specialization: ${doctor.doctor_specialization}
Rank: ${doctor.rank}
Location: ${doctor.address}
Consultation Fee: ₦${doctor.consultation_fee}
Phone: ${doctor.phone}
Email: ${doctor.email}
    `).join('\n---\n');

    const systemPrompt = `You are an intelligent medical advisor for Healthsync. Your job is to:
1. Analyze patient symptoms
2. Determine the appropriate medical department and specialization needed
3. Recommend the MOST SUITABLE doctor from the available doctors database
4. Provide reasoning for your recommendation

AVAILABLE DOCTORS DATABASE:
${doctorsList}

When recommending:
- Match symptoms to the doctor's specialization and department
- Consider the doctor's rank and experience level
- Provide a clear explanation for why this doctor is the best match
- Include the doctor's full details in your response

RESPONSE FORMAT:
You MUST respond in JSON format ONLY with no additional text:
{
  "recommended_doctor_id": "DOCxxx",
  "doctor_name": "Dr. First Last",
  "specialization": "Specialization",
  "department": "Department",
  "rank": "Rank",
  "location": "Address",
  "phone": "Phone",
  "email": "Email",
  "consultation_fee": "Fee",
  "reasoning": "Clear explanation of why this doctor is recommended for these symptoms"
}`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Patient Symptoms: ${patientSymptoms}\n\nBased on these symptoms, recommend the most suitable doctor from the database and explain why.`,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const recommendation = JSON.parse(jsonMatch[0]);
    const recommendedDoctor = doctors.find(doc => doc.doctor_id === recommendation.recommended_doctor_id);

    if (!recommendedDoctor) {
      throw new Error('Recommended doctor not found in database');
    }

    return {
      success: true,
      recommendation: {
        doctor_id: recommendation.recommended_doctor_id,
        doctor_name: recommendation.doctor_name,
        specialization: recommendation.specialization,
        department: recommendation.department,
        rank: recommendation.rank,
        location: recommendation.location,
        phone: recommendation.phone,
        email: recommendation.email,
        consultation_fee: recommendation.consultation_fee,
        sex: recommendedDoctor.sex,
        profile_image: recommendedDoctor.ppurl
      },
      reasoning: recommendation.reasoning,
      message: 'Doctor recommendation successful'
    };
  } catch (err) {
    console.error('Error in AI doctor recommendation:', err);
    return {
      success: false,
      message: 'Error processing doctor recommendation: ' + err.message,
      recommendation: null,
      reasoning: null
    };
  }
}