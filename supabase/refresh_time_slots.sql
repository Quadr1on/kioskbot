-- Refresh time slots for today and next 7 days
-- Run this in Supabase SQL Editor to populate new time slots

-- First, optionally delete old unbooked slots (optional - uncomment if you want to clean up)
-- DELETE FROM time_slots WHERE date < CURRENT_DATE AND is_booked = FALSE;

-- Insert fresh time slots for all doctors for the next 7 days
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

-- Verify the new slots exist
SELECT 
  d.name as doctor_name,
  ts.date,
  COUNT(*) as available_slots
FROM time_slots ts
JOIN doctors d ON ts.doctor_id = d.id
WHERE ts.date >= CURRENT_DATE 
  AND ts.is_booked = FALSE
GROUP BY d.name, ts.date
ORDER BY ts.date, d.name;
