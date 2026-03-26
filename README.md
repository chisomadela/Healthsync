# HealthSync

> **A digital health companion platform built for Nigeria** — connecting patients to doctors through teleconsultations, AI-powered recommendations, and seamless healthcare access.

---

## Table of Contents

- [Product Overview](#-product-overview)
- [Target Users](#-target-users)
- [Problem Statement](#-problem-statement)
- [MVP Features](#-mvp-features)
- [User Journey](#-user-journey)
- [Tech Stack](#-tech-stack)
- [Developer Requirements](#-developer-requirements)
- [Hackathon Scope](#-hackathon-scope)
- [3-Day Build Schedule](#-3-day-build-schedule)

---

## Product Overview

**HealthSync** is a digital health companion platform that connects users to doctors for teleconsultations, enables access to prescriptions and medications, supports emergency hospital discovery, and provides health tracking tools such as reminders and a personal health profile — optimized for accessibility in Nigeria.

HealthSync reduces the stress of hospital visits by digitizing consultations, speeding up access to care, and improving overall healthcare efficiency for patients and providers.

---

## Target Audience

| User Type | Description |
|-----------|-------------|
| **Patients** | Individuals seeking convenient and efficient healthcare access and attention |
| **Doctors** | Healthcare professionals managing teleconsultations and patient queues |

---

## Problem Statement

Healthcare access in Nigeria is often stressful due to:

-  Long hospital queues and waiting times.
-  Manual and inefficient consultation processes.
-  Difficulty in quickly connecting with the right specialist.

---

## MVP Features

The following core features make up the minimum viable product for our hackathon prototype:

- User Authentication (Signup / Login)
- Virtual Hospital Card
- AI Symptom Checker & Doctor Recommendation
- Consultation Booking
- Payment System
- Doctor Dashboard (Basic)

---

## User Journey

### Work Flow

1. **Sign Up** — User registers by entering personal and health details.
2. **Virtual Hospital Card** — User receives a digital card (with option to print)

3. **Dashboard** — User lands on the main dashboard

4. **Consultation Request** — User creates a consultation:
   - Inputs symptoms or health issue into the AI form
   - AI analyzes the input
   - AI recommends a suitable doctor based on category and logic

5. **Doctor Selection** — User picks from the recommended doctors list

6. **Booking & Payment** — User books the consultation and pays the applicable fee

---

## Tech Stack

### Frontend
- Nextjs 17
- Typescript

### Backend
- Node
- Express
- Typescript

### Database 
- Postgres SQL
- Supabase

### AI Component
- Gemini API

### Interswitch API
- 

---
##  Developer Requirements

### Frontend

- User authentication screens (Signup / Login)
- Dashboard UI
- Consultation booking interface
- AI input form (symptom entry)
- Payment interface
- Virtual hospital card UI

### Backend

- Authentication system
- User profile management
- Doctor recommendation logic (AI integration or mock logic)
- Consultation booking system
- Payment integration (or mock payment)
- Database for users, doctors, and consultations

### AI Component

| | |
|---|---|
| **Input** | User-submitted symptoms and health issue description |
| **Output** | Recommended doctor (based on specialty category or recommendation logic) |

---

##  Hackathon Scope

### In Scope

- Core consultation flow end to end
- AI-based doctor recommendation (can be simplified for demo)
- Booking and basic payment flow
- Virtual hospital card
- Clean, simple, and accessible UI

---

## 4-Day Build Schedule

| Phase / Day | Focus Area | Tasks |
|-------------|------------|-------|
| **Day 1** | Planning & Setup | Finalize idea, define MVP, set up project repository, design UI wireframes |
| **Day 2** | Core Development | Build dashboard UI, implement consultation flow, develop AI doctor recommendation logic, build backend APIs |
| **Day 3** | Development Continues | Integrate payment flow, UI cleanup and refinement, comprehensive bug fixes and testing |
| **Final Day** | Finishing Touches | Polish and Testing, Team documentation and submission  |

### Schedule Notes

- Daily check-ins at the start and end of each day were perfromed

- Issues were dealt with as they arose, this helped to prevent accumulation

- Prioritized demo flow stability over feature completeness on Day 3

---

## Document Info

| | |
|---|---|
| **Version** | 1.0 — Draft |
| **Edition** | Hackathon Build |
| **Status** | MVP completed |
| **Confidentiality** | Internal — Hackathon Team Only |
---
