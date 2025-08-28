-- Add tags column to projects table
ALTER TABLE public.projects 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better search performance on tags
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);

-- Create index for full-text search on title and abstract
CREATE INDEX idx_projects_search ON public.projects USING GIN(to_tsvector('english', title || ' ' || COALESCE(abstract, '')));

-- Update existing projects to have empty tags array if null
UPDATE public.projects SET tags = '{}' WHERE tags IS NULL;