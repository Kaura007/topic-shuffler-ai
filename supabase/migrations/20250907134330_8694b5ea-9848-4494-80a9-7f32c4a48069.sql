-- Update the current user to admin role
-- This assumes you're the user with email kaurajamb2018@gmail.com
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = '4fa63488-0ca8-49ef-9cbf-cff24f57c785';