export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskResponsible = 'Ivo' | 'Enzo';

export interface TaskComment {
  id: string;
  text: string;
  date: string;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  description: string;
  responsible: TaskResponsible;
  priority: TaskPriority;
  dueDate: string | null;
  project: string;
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus[];
  responsible?: TaskResponsible[];
  priority?: TaskPriority[];
  project?: string[];
  month?: string;
}