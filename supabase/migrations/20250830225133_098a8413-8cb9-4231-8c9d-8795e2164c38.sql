-- Make due_date nullable since tasks might not always have a specific due date
ALTER TABLE public.tasks ALTER COLUMN due_date DROP NOT NULL;