import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  // Resolve current username once we have the authenticated user
  useEffect(() => {
    const resolveUsername = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=username&email=eq.${encodeURIComponent(user.email)}`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setCurrentUsername(data[0].username);
            return;
          }
        }

        // Fallback mapping
        const emailToUsername: { [key: string]: string } = {
          'ivoezetarodriguez@gmail.com': 'Ivo',
          'enzocaricchio09@gmail.com': 'Enzo',
          'mcadillo.wsh@gmail.com': 'Mirella',
        };
        const username = emailToUsername[user.email];
        if (username) setCurrentUsername(username);
      } catch (error) {
        console.error('Error fetching username:', error);
        const emailToUsername: { [key: string]: string } = {
          'ivoezetarodriguez@gmail.com': 'Ivo',
          'enzocaricchio09@gmail.com': 'Enzo',
          'mcadillo.wsh@gmail.com': 'Mirella',
        };
        const username = emailToUsername[user.email];
        if (username) setCurrentUsername(username);
      }
    };

    resolveUsername();
  }, [user?.email]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // If user is authenticated but we don't yet know their username, wait before showing anything
      if (user && !currentUsername) {
        return; // loading stays true; UI will show spinner until username is ready
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('*');

      if (commentsError) throw commentsError;

      let filteredTasks = tasksData || [];

      // Filtrar tareas por privacidad si hay usuario autenticado
      if (user && currentUsername) {
        filteredTasks = (tasksData || []).filter(task => {
          if (task.privacy === 'private') {
            const sharedWith = Array.isArray(task.shared_with) ? task.shared_with : [];
            return task.responsible === currentUsername || sharedWith.includes(currentUsername) || task.created_by === currentUsername;
          }
          if (task.privacy === 'general') {
            return true;
          }
          return false;
        });
      }
      // If user is authenticated but username isn't ready, do not expose unfiltered tasks
      if (user && !currentUsername) {
        setTasks([]);
        return;
      }

      const tasksWithComments = filteredTasks.map(task => ({
        id: task.id,
        name: task.name,
        status: task.status as Task['status'],
        description: task.description || '',
        responsible: task.responsible as Task['responsible'],
        priority: task.priority as Task['priority'],
        dueDate: task.due_date,
        project: task.project,
        privacy: task.privacy as Task['privacy'],
        sharedWith: Array.isArray(task.shared_with) ? task.shared_with as string[] : [],
        createdBy: task.created_by,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        comments: commentsData?.filter(comment => comment.task_id === task.id)
          .map(comment => ({
            id: comment.id,
            text: comment.text,
            date: comment.date
          })) || []
      }));

      setTasks(tasksWithComments);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Creating task with data:', taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          name: taskData.name,
          status: taskData.status,
          description: taskData.description,
          responsible: taskData.responsible,
          priority: taskData.priority,
          due_date: taskData.dueDate || null,
          project: taskData.project,
          privacy: taskData.privacy,
          shared_with: taskData.sharedWith || [],
          created_by: taskData.createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Task created successfully:', data);

      // Insert comments
      if (taskData.comments && taskData.comments.length > 0) {
        const commentsToInsert = taskData.comments.map(comment => ({
          task_id: data.id,
          text: comment.text,
          date: comment.date
        }));

        const { error: commentsError } = await supabase.from('task_comments').insert(commentsToInsert);
        if (commentsError) {
          console.error('Error inserting comments:', commentsError);
          // Don't throw here, task was created successfully
        }
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
          due_date: taskData.dueDate || null,
          project: taskData.project,
          privacy: taskData.privacy,
          shared_with: taskData.sharedWith || [],
          created_by: taskData.createdBy
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

  // Fetch when username is resolved (for authenticated users), or immediately for guests
  useEffect(() => {
    if (!user || currentUsername) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentUsername]);

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