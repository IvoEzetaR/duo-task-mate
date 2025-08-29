-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'review', 'completed')),
  description TEXT,
  responsible TEXT NOT NULL CHECK (responsible IN ('Ivo', 'Enzo')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE NOT NULL,
  project TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks (public access for now)
CREATE POLICY "Tasks are viewable by everyone" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Tasks can be created by everyone" 
ON public.tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Tasks can be updated by everyone" 
ON public.tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Tasks can be deleted by everyone" 
ON public.tasks 
FOR DELETE 
USING (true);

-- Create policies for task comments
CREATE POLICY "Task comments are viewable by everyone" 
ON public.task_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Task comments can be created by everyone" 
ON public.task_comments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Task comments can be updated by everyone" 
ON public.task_comments 
FOR UPDATE 
USING (true);

CREATE POLICY "Task comments can be deleted by everyone" 
ON public.task_comments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();