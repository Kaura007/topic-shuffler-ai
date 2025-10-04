-- Drop the existing foreign key constraint
ALTER TABLE public.history_logs 
DROP CONSTRAINT IF EXISTS history_logs_project_id_fkey;

-- Add it back with ON DELETE CASCADE
ALTER TABLE public.history_logs 
ADD CONSTRAINT history_logs_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;