-- Backfill users table with existing auth users who don't have profiles yet
INSERT INTO public.users (id, name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'user')
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
