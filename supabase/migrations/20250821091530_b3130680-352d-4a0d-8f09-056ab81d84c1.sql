-- Update the handle_new_user function to include department_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, role, department_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'student',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'department_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'department_id')::uuid 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$function$;