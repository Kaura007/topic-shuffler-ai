-- Create RLS policies for the project-files storage bucket

-- Policy for users to upload files to their own folders
CREATE POLICY "Users can upload their own project files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to view their own files
CREATE POLICY "Users can view their own project files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own files
CREATE POLICY "Users can update their own project files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own files
CREATE POLICY "Users can delete their own project files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for admins to access all project files
CREATE POLICY "Admins can access all project files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'project-files' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy for viewing projects - users can view files of projects they can see
CREATE POLICY "Users can view project files for accessible projects"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-files' 
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles prof ON p.student_id = prof.id
    WHERE p.file_url = name
  )
);