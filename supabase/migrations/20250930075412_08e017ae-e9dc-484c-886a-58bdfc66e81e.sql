-- Add matriculation_number column to projects table
ALTER TABLE public.projects 
ADD COLUMN matriculation_number text;

-- Create index for faster searches by matriculation number
CREATE INDEX idx_projects_matriculation_number ON public.projects(matriculation_number);

-- Add comment to document the column
COMMENT ON COLUMN public.projects.matriculation_number IS 'Student matriculation number for project identification';