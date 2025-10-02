-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::public.app_role
FROM public.profiles
WHERE role IS NOT NULL;

-- Update RLS policies on profiles table to use has_role function
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies on projects table
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
CREATE POLICY "Admins can manage all projects" 
ON public.projects 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies on departments table
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies on history_logs table
DROP POLICY IF EXISTS "Users can view relevant history logs" ON public.history_logs;
CREATE POLICY "Users can view relevant history logs" 
ON public.history_logs 
FOR SELECT 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update get_current_user_role function to use user_roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Update handle_new_user trigger function to create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Determine role from metadata, default to 'student'
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'student');
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, department_id, matriculation_number)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'department_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'department_id')::uuid 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data ->> 'matriculation_number'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Remove role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;