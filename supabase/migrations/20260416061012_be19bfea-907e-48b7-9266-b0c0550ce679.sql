
-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'cashier',
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow inserts for the trigger (runs as service role) and for admins adding staff
CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to handle new user signup - first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT;
  user_name TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cashier');
  END IF;
  
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  
  INSERT INTO public.profiles (id, name, role, branch_id)
  VALUES (
    NEW.id,
    user_name,
    user_role,
    (SELECT id FROM public.branches LIMIT 1)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
