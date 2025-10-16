-- Fix security issues identified by Supabase advisors

-- Fix function search_path mutability by setting search_path explicitly
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create improved timestamp update function with proper security
CREATE OR REPLACE FUNCTION public.update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply secure function to all relevant tables
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamps();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamps();

-- Add indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON public.tasks(responsible);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_privacy ON public.tasks(privacy);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Add constraint to ensure valid email format in users table
ALTER TABLE public.users 
ADD CONSTRAINT valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to ensure username is not empty
ALTER TABLE public.users 
ADD CONSTRAINT valid_username 
CHECK (length(trim(username)) > 0);

-- Add constraint to ensure task name is not empty
ALTER TABLE public.tasks 
ADD CONSTRAINT valid_task_name 
CHECK (length(trim(name)) > 0);

-- Add comment for documentation
COMMENT ON FUNCTION public.update_timestamps() IS 'Secure function to update updated_at timestamp with proper search_path';