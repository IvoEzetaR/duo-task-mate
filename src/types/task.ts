export type TaskStatus = 'pending' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskResponsible = string; // Ahora es string para nombres de usuario dinámicos
export type TaskPrivacy = 'private' | 'general';

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
  responsible: TaskResponsible; // Ahora es string (username)
  priority: TaskPriority;
  dueDate: string | null;
  project: string;
  comments: TaskComment[];
  privacy: TaskPrivacy;
  sharedWith: string[]; // Array de usernames
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus[];
  responsible?: TaskResponsible[];
  priority?: TaskPriority[];
  project?: string[];
  privacy?: TaskPrivacy[];
  month?: string;
}