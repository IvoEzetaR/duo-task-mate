-- Adjust tasks table responsible constraint and shared_with column

-- Drop the static responsible constraint to allow dynamic usernames
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_responsible_check;

-- Ensure shared_with column exists as jsonb array of usernames
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN shared_with jsonb NOT NULL DEFAULT '[]'::jsonb;
  ELSE
    ALTER TABLE public.tasks
      ALTER COLUMN shared_with TYPE jsonb
      USING (
        CASE
          WHEN pg_typeof(shared_with) = 'json'::regtype THEN shared_with::jsonb
          WHEN pg_typeof(shared_with) = 'jsonb'::regtype THEN shared_with
          ELSE to_jsonb(shared_with)
        END
      );

    ALTER TABLE public.tasks
      ALTER COLUMN shared_with SET DEFAULT '[]'::jsonb;

    ALTER TABLE public.tasks
      ALTER COLUMN shared_with SET NOT NULL;
  END IF;
END
$$;

-- Guarantee shared_with values are arrays (replace nulls)
UPDATE public.tasks
SET shared_with = '[]'::jsonb
WHERE shared_with IS NULL;
