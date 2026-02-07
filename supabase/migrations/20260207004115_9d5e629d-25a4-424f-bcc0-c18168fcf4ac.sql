-- Fix: Deny anonymous access to profiles table
-- This hardens the existing policy to explicitly require authentication

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);