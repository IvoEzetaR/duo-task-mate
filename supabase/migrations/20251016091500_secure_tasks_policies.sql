-- Harden row level security and ensure users directory

-- Dependencies for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure users table exists for username directory
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reuse timestamp trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Enable RLS on all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive legacy policies
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be created by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be updated by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Tasks can be deleted by everyone" ON public.tasks;

DROP POLICY IF EXISTS "Task comments are viewable by everyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be created by everyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be updated by everyone" ON public.task_comments;
DROP POLICY IF EXISTS "Task comments can be deleted by everyone" ON public.task_comments;

-- Helper expression: resolve current username if registered
CREATE OR REPLACE VIEW public.current_user_profile AS
SELECT
  u.id,
  u.email,
  u.username
FROM public.users u
WHERE u.email = auth.jwt()->>'email';

-- Policies for users directory
DROP POLICY IF EXISTS "Users are viewable by authenticated" ON public.users;
CREATE POLICY "Users are viewable by authenticated"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Tasks select policy: allow general visibility or private if participant
CREATE POLICY "Tasks select policy"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  privacy = 'general'
  OR EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.email = auth.jwt()->>'email'
      AND (
        u.username = responsible
        OR u.username = created_by
        OR shared_with ? u.username
      )
  )
);

-- Tasks insert policy: creator must match authenticated identity
CREATE POLICY "Tasks insert policy"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.email = auth.jwt()->>'email'
      AND u.username = created_by
  )
  OR created_by = lower(split_part(auth.jwt()->>'email', '@', 1))
);

-- Tasks update policy: only creator or responsible can modify
CREATE POLICY "Tasks update policy"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.email = auth.jwt()->>'email'
      AND (u.username = created_by OR u.username = responsible)
  )
);

-- Tasks delete policy: only creator can delete
CREATE POLICY "Tasks delete policy"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.email = auth.jwt()->>'email'
      AND u.username = created_by
  )
);

-- Task comments select policy: visibility tied to parent task permissions
CREATE POLICY "Task comments select policy"
ON public.task_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.users u ON u.email = auth.jwt()->>'email'
    WHERE t.id = task_id
      AND (
        t.privacy = 'general'
        OR u.username = t.created_by
        OR u.username = t.responsible
        OR t.shared_with ? u.username
      )
  )
);

-- Task comments insert policy: allow if user can view associated task
CREATE POLICY "Task comments insert policy"
ON public.task_comments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.users u ON u.email = auth.jwt()->>'email'
    WHERE t.id = task_id
      AND (
        t.privacy = 'general'
        OR u.username = t.created_by
        OR u.username = t.responsible
        OR t.shared_with ? u.username
      )
  )
);

-- Task comments update policy: mirror task update permissions
CREATE POLICY "Task comments update policy"
ON public.task_comments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.users u ON u.email = auth.jwt()->>'email'
    WHERE t.id = task_id
      AND (u.username = t.created_by OR u.username = t.responsible)
  )
);

-- Task comments delete policy: mirror task delete permissions
CREATE POLICY "Task comments delete policy"
ON public.task_comments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.users u ON u.email = auth.jwt()->>'email'
    WHERE t.id = task_id
      AND (u.username = t.created_by OR u.username = t.responsible)
  )
);
