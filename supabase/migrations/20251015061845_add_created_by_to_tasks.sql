-- Add created_by column to tasks table
ALTER TABLE public.tasks ADD COLUMN created_by TEXT NOT NULL DEFAULT '';

-- Update existing tasks to have empty created_by (will be updated by app logic)
UPDATE public.tasks SET created_by = '' WHERE created_by IS NULL;