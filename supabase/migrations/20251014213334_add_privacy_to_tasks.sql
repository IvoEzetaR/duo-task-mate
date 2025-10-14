-- Add privacy column to tasks table
ALTER TABLE public.tasks ADD COLUMN privacy TEXT NOT NULL DEFAULT 'general' CHECK (privacy IN ('private', 'general'));

-- Update existing tasks to have 'general' privacy by default
UPDATE public.tasks SET privacy = 'general' WHERE privacy IS NULL;