-- Hospital Kiosk Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable trigram extension for fuzzy search (must be before indexes that use it)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  floor INTEGER NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  specialization VARCHAR(200),
  qualification VARCHAR(200),
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time slots for appointments
CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date, start_time)
);

-- Patients (admitted)
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  room_number VARCHAR(20),
  department_id INTEGER REFERENCES departments(id),
  admitted_at TIMESTAMPTZ DEFAULT NOW(),
  diagnosis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  slot_id INTEGER REFERENCES time_slots(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital information (for RAG)
CREATE TABLE IF NOT EXISTS hospital_info (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions for context
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  messages JSONB DEFAULT '[]'::jsonb,
  language VARCHAR(10) DEFAULT 'en-IN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_date ON time_slots(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_booked, date) WHERE NOT is_booked;
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hospital_info_category ON hospital_info(category);


-- Row Level Security (RLS) policies
-- For a public kiosk, we use permissive policies but still enable RLS

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read access to all tables for anonymous users (kiosk)
CREATE POLICY "Allow read access to departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow read access to doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow read access to time_slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Allow read access to patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow read access to hospital_info" ON hospital_info FOR SELECT USING (true);

-- Allow insert/update for appointments (kiosk can book)
CREATE POLICY "Allow insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read appointments" ON appointments FOR SELECT USING (true);

-- Allow update on time_slots for booking
CREATE POLICY "Allow update time_slots" ON time_slots FOR UPDATE USING (true);

-- Chat sessions can be created and read
CREATE POLICY "Allow all on chat_sessions" ON chat_sessions FOR ALL USING (true);
