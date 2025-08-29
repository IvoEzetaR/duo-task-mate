import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment } from '@/types/task';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('*');

      if (commentsError) throw commentsError;

      const tasksWithComments = tasksData?.map(task => ({
        id: task.id,
        name: task.name,
        status: task.status as Task['status'],
        description: task.description || '',
        responsible: task.responsible as Task['responsible'],
        priority: task.priority as Task['priority'],
        dueDate: task.due_date,
        project: task.project,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        comments: commentsData?.filter(comment => comment.task_id === task.id)
          .map(comment => ({
            id: comment.id,
            text: comment.text,
            date: comment.date
          })) || []
      })) || [];

      setTasks(tasksWithComments);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: taskData.name,
          status: taskData.status,
          description: taskData.description,
          responsible: taskData.responsible,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          project: taskData.project
        })
        .select()
        .single();

      if (error) throw error;

      // Insert comments
      if (taskData.comments && taskData.comments.length > 0) {
        const commentsToInsert = taskData.comments.map(comment => ({
          task_id: data.id,
          text: comment.text,
          date: comment.date
        }));

        await supabase.from('task_comments').insert(commentsToInsert);
      }

      await fetchTasks();
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskData: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          name: taskData.name,
          status: taskData.status,
          description: taskData.description,
          responsible: taskData.responsible,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          project: taskData.project
        })
        .eq('id', taskData.id);

      if (error) throw error;

      // Delete existing comments and insert new ones
      await supabase.from('task_comments').delete().eq('task_id', taskData.id);

      if (taskData.comments && taskData.comments.length > 0) {
        const commentsToInsert = taskData.comments.map(comment => ({
          task_id: taskData.id,
          text: comment.text,
          date: comment.date
        }));

        await supabase.from('task_comments').insert(commentsToInsert);
      }

      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refetch: fetchTasks
  };
}