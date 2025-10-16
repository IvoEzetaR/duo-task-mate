import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { cache, CACHE_KEYS, invalidateTaskCache } from '@/lib/cache';
import { withErrorHandling, DatabaseError, AuthenticationError } from '@/lib/errors';
import { withCache } from '@/lib/cache';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  // Resolve current username usando el cliente de Supabase
  useEffect(() => {
    const resolveUsername = async () => {
      if (!user?.email) return;
      
      try {
        const username = await withCache(
          `username_${user.email}`,
          async () => {
            if (!user.email) throw new Error('User email is required');
            
            const { data, error } = await supabase
              .from('users')
              .select('username')
              .eq('email', user.email)
              .single();
            
            if (error) {
              // Si no existe el usuario, crear uno nuevo
              if (error.code === 'PGRST116') {
                const { data: newUser, error: insertError } = await supabase
                  .from('users')
                  .insert({
                    email: user.email,
                    username: user.email.split('@')[0].toLowerCase()
                  })
                  .select('username')
                  .single();
                
                if (insertError) throw insertError;
                return newUser.username;
              }
              throw error;
            }
            
            return data.username;
          },
          30 * 60 * 1000 // 30 minutos
        );
        
        setCurrentUsername(username);
      } catch (error) {
        console.error('Error resolving username:', error);
        // En caso de error, usar la parte del email como username
        const fallbackUsername = user.email.split('@')[0].toLowerCase();
        setCurrentUsername(fallbackUsername);
      }
    };

    resolveUsername();
  }, [user?.email]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Even si no tenemos username aún, podemos cargar y luego filtrar solo generales

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

      // Visibilidad:
      // - No autenticado: solo generales
      // - Autenticado y con username: generales + privadas donde el usuario es responsable o está en compartidos
      // - Autenticado sin username resuelto aún: mostrar solo generales (evitar exponer privadas)
      if (!user) {
        filteredTasks = (tasksData || []).filter(task => task.privacy === 'general');
      } else if (user && !currentUsername) {
        filteredTasks = (tasksData || []).filter(task => task.privacy === 'general');
      } else {
        filteredTasks = (tasksData || []).filter(task => {
          if (task.privacy === 'general') return true;
          if (!currentUsername) return false;
          const sharedWith = Array.isArray(task.shared_with) ? task.shared_with as string[] : [];
          return task.responsible === currentUsername ||
                 task.created_by === currentUsername ||
                 sharedWith.includes(currentUsername);
        });
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

      // Invalidar caché
      invalidateTaskCache();
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
          shared_with: taskData.sharedWith || []
        })
        .eq('id', taskData.id);

      if (error) throw error;

      // Optimización: actualizar solo los comentarios que han cambiado
      if (taskData.comments && taskData.comments.length > 0) {
        // Obtener comentarios existentes
        const { data: existingComments } = await supabase
          .from('task_comments')
          .select('*')
          .eq('task_id', taskData.id);

        const existingCommentIds = new Set(existingComments?.map(c => c.id) || []);
        const newCommentIds = new Set(taskData.comments.map(c => c.id));

        // Eliminar comentarios que ya no existen
        const commentsToDelete = existingComments?.filter(c => !newCommentIds.has(c.id)) || [];
        if (commentsToDelete.length > 0) {
          await supabase
            .from('task_comments')
            .delete()
            .in('id', commentsToDelete.map(c => c.id));
        }

        // Insertar solo comentarios nuevos
        const commentsToInsert = taskData.comments.filter(comment => !existingCommentIds.has(comment.id));
        if (commentsToInsert.length > 0) {
          const commentsData = commentsToInsert.map(comment => ({
            task_id: taskData.id,
            text: comment.text,
            date: comment.date
          }));
          await supabase.from('task_comments').insert(commentsData);
        }
      } else {
        // Si no hay comentarios, eliminar todos los existentes
        await supabase.from('task_comments').delete().eq('task_id', taskData.id);
      }

      // Invalidar caché
      invalidateTaskCache(taskData.id);
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

      // Invalidar caché
      invalidateTaskCache(taskId);
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

      // Invalidar caché
      invalidateTaskCache(taskId);
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