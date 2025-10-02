-- Allow manual student name entry for admin submissions
-- Make student_id nullable since admins can enter student names manually
ALTER TABLE public.projects ALTER COLUMN student_id DROP NOT NULL;

-- Add student_name field to store manually entered student names
ALTER TABLE public.projects ADD COLUMN student_name TEXT;

-- Add check to ensure either student_id or student_name is provided
ALTER TABLE public.projects ADD CONSTRAINT student_id_or_name_required 
  CHECK (student_id IS NOT NULL OR student_name IS NOT NULL);