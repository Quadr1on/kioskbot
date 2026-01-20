-- Seed data for Hospital Kiosk
-- Run this after the schema migration

-- Insert departments
INSERT INTO departments (name, floor, description, phone) VALUES
  ('General Medicine', 1, 'Primary care and general health consultations', '044-2345-6701'),
  ('Cardiology', 2, 'Heart and cardiovascular system care', '044-2345-6702'),
  ('Neurology', 2, 'Brain and nervous system disorders', '044-2345-6703'),
  ('Orthopedics', 3, 'Bone, joint, and muscle treatments', '044-2345-6704'),
  ('Pediatrics', 1, 'Medical care for infants, children, and adolescents', '044-2345-6705'),
  ('Gynecology', 4, 'Women''s reproductive health', '044-2345-6706'),
  ('Dermatology', 3, 'Skin, hair, and nail conditions', '044-2345-6707'),
  ('ENT', 3, 'Ear, nose, and throat specialist care', '044-2345-6708'),
  ('Ophthalmology', 4, 'Eye care and vision services', '044-2345-6709'),
  ('Gastroenterology', 2, 'Digestive system disorders', '044-2345-6710'),
  ('Emergency', 0, '24/7 emergency and trauma care', '044-2345-1066'),
  ('Radiology', 0, 'X-ray, CT, MRI imaging services', '044-2345-6712')
ON CONFLICT (name) DO NOTHING;

-- Insert doctors
INSERT INTO doctors (name, department_id, specialization, qualification, available_days) VALUES
  ('Dr. Arun Kumar', 1, 'Internal Medicine', 'MBBS, MD (Internal Medicine)', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  ('Dr. Priya Sharma', 1, 'Family Medicine', 'MBBS, DNB (Family Medicine)', ARRAY['Monday', 'Wednesday', 'Friday']),
  ('Dr. Rajesh Venkataraman', 2, 'Interventional Cardiology', 'MBBS, DM (Cardiology)', ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday']),
  ('Dr. Lakshmi Narayanan', 2, 'Non-invasive Cardiology', 'MBBS, MD, DM (Cardiology)', ARRAY['Tuesday', 'Wednesday', 'Saturday']),
  ('Dr. Suresh Babu', 3, 'Epilepsy & Stroke', 'MBBS, DM (Neurology)', ARRAY['Monday', 'Wednesday', 'Friday']),
  ('Dr. Meera Krishnamurthy', 3, 'Movement Disorders', 'MBBS, MD, DM (Neurology)', ARRAY['Tuesday', 'Thursday', 'Saturday']),
  ('Dr. Karthik Rajan', 4, 'Joint Replacement', 'MBBS, MS (Ortho), MCh', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday']),
  ('Dr. Anitha Sundaram', 5, 'Pediatric Care', 'MBBS, MD (Pediatrics)', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  ('Dr. Deepa Ranganathan', 6, 'High-risk Pregnancy', 'MBBS, MD (OB-GYN)', ARRAY['Monday', 'Wednesday', 'Thursday', 'Friday']),
  ('Dr. Vivek Subramanian', 7, 'Cosmetic Dermatology', 'MBBS, MD (Dermatology)', ARRAY['Tuesday', 'Thursday', 'Saturday']),
  ('Dr. Ramya Gopalan', 8, 'ENT Surgery', 'MBBS, MS (ENT)', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Friday']),
  ('Dr. Senthil Kumar', 9, 'Cataract Surgery', 'MBBS, MS (Ophthalmology)', ARRAY['Monday', 'Wednesday', 'Thursday', 'Friday']),
  ('Dr. Padma Viswanathan', 10, 'Liver Diseases', 'MBBS, DM (Gastroenterology)', ARRAY['Tuesday', 'Wednesday', 'Friday', 'Saturday']);

-- Insert time slots for today and next 7 days
DO $$
DECLARE
  doc RECORD;
  slot_date DATE;
  i INTEGER;
BEGIN
  FOR doc IN SELECT id FROM doctors LOOP
    FOR i IN 0..7 LOOP
      slot_date := CURRENT_DATE + i;
      -- Morning slots
      INSERT INTO time_slots (doctor_id, date, start_time, end_time, is_booked)
      VALUES 
        (doc.id, slot_date, '09:00', '09:30', FALSE),
        (doc.id, slot_date, '09:30', '10:00', FALSE),
        (doc.id, slot_date, '10:00', '10:30', FALSE),
        (doc.id, slot_date, '10:30', '11:00', FALSE),
        (doc.id, slot_date, '11:00', '11:30', FALSE),
        (doc.id, slot_date, '11:30', '12:00', FALSE),
        -- Afternoon slots
        (doc.id, slot_date, '14:00', '14:30', FALSE),
        (doc.id, slot_date, '14:30', '15:00', FALSE),
        (doc.id, slot_date, '15:00', '15:30', FALSE),
        (doc.id, slot_date, '15:30', '16:00', FALSE),
        (doc.id, slot_date, '16:00', '16:30', FALSE)
      ON CONFLICT (doctor_id, date, start_time) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample admitted patients
INSERT INTO patients (name, phone, room_number, department_id, diagnosis, admitted_at) VALUES
  ('Rajesh Kumar', '9876543210', '201-A', 2, 'Cardiac monitoring post angioplasty', NOW() - INTERVAL '2 days'),
  ('Lakshmi Devi', '9876543211', '301-B', 4, 'Post hip replacement surgery recovery', NOW() - INTERVAL '5 days'),
  ('Mohammed Farooq', '9876543212', '203-A', 2, 'Heart failure management', NOW() - INTERVAL '1 day'),
  ('Kavitha Sundaram', '9876543213', '102-C', 1, 'Dengue fever treatment', NOW() - INTERVAL '3 days'),
  ('Senthil Murugan', '9876543214', '204-B', 3, 'Post-stroke rehabilitation', NOW() - INTERVAL '7 days'),
  ('Priya Natarajan', '9876543215', '401-A', 6, 'Post C-section care', NOW() - INTERVAL '2 days'),
  ('Venkatesh Iyer', '9876543216', '302-A', 4, 'Knee replacement recovery', NOW() - INTERVAL '4 days'),
  ('Anjali Krishnan', '9876543217', '105-B', 5, 'Pediatric pneumonia treatment', NOW() - INTERVAL '3 days');

-- Insert hospital information for RAG
INSERT INTO hospital_info (category, title, content) VALUES
  ('visiting_hours', 'General Visiting Hours', 
   'Visiting hours at SIMS Hospital are from 10:00 AM to 12:00 PM in the morning and 4:00 PM to 7:00 PM in the evening. ICU patients have restricted visiting hours of 11:00 AM to 11:30 AM and 5:00 PM to 5:30 PM. A maximum of 2 visitors are allowed per patient at a time.'),
  
  ('visiting_hours', 'ICU Visiting Rules',
   'ICU visiting hours are strictly limited to 11:00 AM to 11:30 AM and 5:00 PM to 5:30 PM. Only one visitor is allowed at a time. Visitors must wear protective gear provided by the hospital. Children under 12 are not permitted in the ICU.'),
  
  ('facilities', 'Parking Information',
   'SIMS Hospital has a multi-level parking facility. First 30 minutes are free. Charges are Rs. 20 per hour after that. Valet parking is available at the main entrance for Rs. 100. Wheelchair-accessible parking spots are available near the entrance.'),
  
  ('facilities', 'Cafeteria and Food',
   'The hospital cafeteria is located on the ground floor and is open from 7:00 AM to 9:00 PM. We offer vegetarian and non-vegetarian options. Special dietary meals for patients are managed by our dietetics department. Family members can order food at the nurses station.'),
  
  ('facilities', 'Pharmacy',
   'Our 24/7 pharmacy is located on the ground floor near the main entrance. Prescriptions from SIMS doctors are given priority. We stock all common medications and can arrange for special medications within 24 hours.'),
  
  ('emergency', 'Emergency Services',
   'Our Emergency department operates 24 hours, 7 days a week. For emergencies, call 1066 or come directly to the Emergency entrance on the ground floor. We have a dedicated trauma team available round the clock. Ambulance services can be requested at 044-2345-1066.'),
  
  ('billing', 'Payment Methods',
   'We accept cash, credit/debit cards, UPI payments, and all major insurance providers. TPA desk is available on the ground floor from 8 AM to 8 PM. For insurance claims, please bring your policy documents and ID proof.'),
  
  ('billing', 'Insurance and TPA',
   'SIMS Hospital is empaneled with all major insurance companies including Star Health, ICICI Lombard, HDFC Ergo, New India Assurance, and more. Cashless treatment is available for approved policies. Contact our TPA desk for pre-authorization.'),
  
  ('general', 'Hospital Timings',
   'OPD timings are from 8:00 AM to 8:00 PM, Monday to Saturday. Sunday OPD is available from 9:00 AM to 1:00 PM for select departments. The hospital administration office is open from 9:00 AM to 5:00 PM on weekdays.'),
  
  ('general', 'Appointment Booking',
   'Appointments can be booked through this kiosk, our website, or by calling 044-2345-6700. Walk-in consultations are also available based on doctor availability. For specialist consultations, prior appointment is recommended.'),
  
  ('facilities', 'Wheelchair and Stretcher',
   'Wheelchairs are available free of charge at all entrances. Stretchers can be requested at the reception. Our staff will assist patients who need mobility support. Electric wheelchair service is available for elderly patients.'),
  
  ('rules', 'Mobile Phone Usage',
   'Mobile phones should be kept on silent mode inside the hospital. Phone calls are restricted in ICU, Operation Theatre, and diagnostic areas. A designated phone call area is available on each floor.'),
  
  ('rules', 'No Smoking Policy',
   'SIMS Hospital is a 100% smoke-free zone. Smoking is strictly prohibited anywhere on hospital premises including parking areas. Violations may result in fine as per government regulations.');
