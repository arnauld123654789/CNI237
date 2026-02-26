-- Optional emergency metadata for digital citizen data card
ALTER TABLE IF EXISTS cni_data
  ADD COLUMN IF NOT EXISTS emergency_contact_1_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_1_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2_phone text,
  ADD COLUMN IF NOT EXISTS medical_allergies text,
  ADD COLUMN IF NOT EXISTS medical_preferences text,
  ADD COLUMN IF NOT EXISTS chronic_diseases text;
