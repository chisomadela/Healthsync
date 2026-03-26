# Consultation API Documentation

## Overview
The Consultation API handles creating consultations between doctors and patients with automatic queuing logic. When a new consultation is created, the system checks the doctor's last consultation and schedules the new one to start shortly after, creating a queue-like system.

## Features

### 1. **Automatic Consultation Queuing**
- When a consultation is created for a doctor, the system fetches the doctor's last consultation
- The new consultation is scheduled to start after the last one ends, with a configurable buffer time (default 30 minutes)
- This ensures consultations don't overlap and follows a queue order

### 2. **Consultation Status Tracking**
- **pending**: The consultation is scheduled and waiting to start
- **ended**: The consultation has been completed by the doctor
- The status transitions are managed through dedicated endpoints

### 3. **Doctor-Only Access**
- Only doctors can mark consultations as ended
- The system validates that the doctor owns the consultation before allowing modifications

## Database Schema
```sql
CREATE TABLE public.consultation (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMP,
  description TEXT,
  doctor_fname TEXT,
  patient_fname TEXT,
  consultation_date DATE,
  consultation_time TIMESTAMP,
  consultation_fee TEXT,
  status TEXT DEFAULT 'pending',
  doctor_id TEXT
)
```

## API Endpoints

### 1. Create Consultation
**POST** `/consultation/create`

Creates a new consultation and automatically queues it after the doctor's last consultation.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctor_id": "string (required)",
  "patient_id": "string (required)",
  "description": "string (optional)",
  "bufferMinutes": "number (optional, default 30, min 15)"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Consultation created successfully",
  "data": {
    "consultation": {
      "id": 123,
      "doctor_id": "doc_123",
      "doctor_fname": "John Doe",
      "patient_fname": "Jane Smith",
      "consultation_time": "2026-03-26T10:30:00Z",
      "consultation_date": "2026-03-26",
      "description": "Patient consultation for headache symptoms",
      "status": "pending",
      "created_at": "2026-03-26T09:00:00Z"
    },
    "queueInfo": {
      "scheduledAfterPreviousConsultation": true,
      "previousConsultationInfo": {
        "consultationId": 122,
        "previousTime": "2026-03-26T10:00:00Z"
      }
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "doctor_id and patient_id are required"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Patient not found"
}
```

---

### 2. End Consultation (Doctor Only)
**POST** `/consultation/:consultationId/end`

Marks a consultation as ended. Only the doctor who owns the consultation can end it.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctor_id": "string (required)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Consultation marked as ended",
  "consultation": {
    "id": 123,
    "doctor_id": "doc_123",
    "doctor_fname": "John Doe",
    "patient_fname": "Jane Smith",
    "consultation_time": "2026-03-26T10:30:00Z",
    "consultation_date": "2026-03-26",
    "status": "ended",
    "created_at": "2026-03-26T09:00:00Z"
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Unauthorized: You can only end your own consultations"
}
```

---

### 3. Get Pending Consultations (Doctor)
**GET** `/consultation/doctor/:doctor_id/pending`

Retrieves all pending consultations for a specific doctor.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "doctor_id": "doc_123",
    "pendingConsultations": [
      {
        "id": 123,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Jane Smith",
        "consultation_time": "2026-03-26T10:30:00Z",
        "consultation_date": "2026-03-26",
        "status": "pending",
        "description": "Patient consultation for headache symptoms"
      },
      {
        "id": 124,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Mike Johnson",
        "consultation_time": "2026-03-26T11:00:00Z",
        "consultation_date": "2026-03-26",
        "status": "pending",
        "description": null
      }
    ],
    "count": 2
  }
}
```

---

### 4. Get All Consultations (Doctor)
**GET** `/consultation/doctor/:doctor_id/all`

Retrieves all consultations for a specific doctor (all statuses) in chronological order. Includes a summary of consultation counts by status.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "doctor_id": "doc_123",
    "summary": {
      "total": 5,
      "pending": 2,
      "ongoing": 1,
      "ended": 2
    },
    "allConsultations": [
      {
        "id": 121,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Alice Brown",
        "consultation_time": "2026-03-26T09:00:00Z",
        "consultation_date": "2026-03-26",
        "status": "ended"
      },
      {
        "id": 122,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Bob Wilson",
        "consultation_time": "2026-03-26T10:00:00Z",
        "consultation_date": "2026-03-26",
        "status": "ongoing"
      },
      {
        "id": 123,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Jane Smith",
        "consultation_time": "2026-03-26T10:30:00Z",
        "consultation_date": "2026-03-26",
        "status": "pending"
      },
      {
        "id": 124,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Mike Johnson",
        "consultation_time": "2026-03-26T11:00:00Z",
        "consultation_date": "2026-03-26",
        "status": "pending"
      },
      {
        "id": 125,
        "doctor_id": "doc_123",
        "doctor_fname": "John Doe",
        "patient_fname": "Sarah Davis",
        "consultation_time": "2026-03-26T11:30:00Z",
        "consultation_date": "2026-03-26",
        "status": "ended"
      }
    ],
    "byStatus": {
      "pending": [
        {
          "id": 123,
          "consultation_time": "2026-03-26T10:30:00Z",
          "status": "pending"
        },
        {
          "id": 124,
          "consultation_time": "2026-03-26T11:00:00Z",
          "status": "pending"
        }
      ],
      "ongoing": [
        {
          "id": 122,
          "consultation_time": "2026-03-26T10:00:00Z",
          "status": "ongoing"
        }
      ],
      "ended": [
        {
          "id": 121,
          "consultation_time": "2026-03-26T09:00:00Z",
          "status": "ended"
        },
        {
          "id": 125,
          "consultation_time": "2026-03-26T11:30:00Z",
          "status": "ended"
        }
      ]
    }
  }
}
```

---

### 5. Get Consultation Queue (Doctor)
**GET** `/consultation/doctor/:doctor_id/queue`

Retrieves the consultation queue for a doctor (all pending and ongoing consultations in chronological order).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "doctor_id": "doc_123",
    "consultationQueue": [
      {
        "id": 123,
        "consultation_time": "2026-03-26T10:30:00Z",
        "status": "pending"
      },
      {
        "id": 124,
        "consultation_time": "2026-03-26T11:00:00Z",
        "status": "pending"
      }
    ],
    "count": 2
  }
}
```

---

### 6. Get Specific Consultation
**GET** `/consultation/:consultationId`

Retrieves a specific consultation by ID.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "doctor_id": "doc_123",
    "doctor_fname": "John Doe",
    "patient_fname": "Jane Smith",
    "consultation_time": "2026-03-26T10:30:00Z",
    "consultation_date": "2026-03-26",
    "status": "pending",
    "description": "Patient consultation for headache symptoms",
    "created_at": "2026-03-26T09:00:00Z"
  }
}
```

---

## How the Queuing System Works

### Example Scenario:
1. **Dr. Smith's Schedule:**
   - Consultation A: 10:00 AM - 10:30 AM (just created, status = pending)

2. **Request:** Create a consultation for Dr. Smith with default buffer (30 minutes)
   - System fetches Consultation A (last consultation)
   - Consultation A scheduled time: 10:00 AM
   - New consultation scheduled at: 10:30 AM + 30 min buffer = **11:00 AM**

3. **Result:**
   - Consultation A: 10:00 AM - pending
   - Consultation B: 11:00 AM - pending (automatically queued)

4. **When Dr. Smith ends Consultation A:**
   - POST `/consultation/A/end` with doctor_id
   - Status changes to "ended"
   - Consultation B remains pending and available

### Parameters:
- **bufferMinutes** (default: 30): Time gap between the end of the last consultation and the start of the new one. Minimum 15 minutes.
- If no previous consultation exists, the new one is scheduled at the current time + buffer minutes

## Error Handling

| Status Code | Scenario |
|------------|----------|
| 201 | Consultation created successfully |
| 200 | Consultation updated (ended) |
| 400 | Missing or invalid required fields |
| 403 | Unauthorized (not a doctor, or consultation doesn't belong to doctor) |
| 404 | Patient or consultation not found |
| 500 | Server error |

## Implementation Notes

- All timestamps are stored in ISO 8601 format with timezone information
- Consultation dates are stored separately as DATE type for easier querying
- The status field defaults to 'pending' on creation
- Authentication is required for all endpoints (JWT token in Authorization header)
- Doctors are verified from the `doctors` table
- Patients are verified from the `users` table with role='patient'
