import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "@/components/TaskCard";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { TaskFiltersComponent } from "@/components/TaskFilters";
import { Task, TaskFilters } from "@/types/task";
import { Plus, Grid3X3, Table, CheckCircle2, Clock, AlertCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState<TaskFilters & { search: string }>({ search: '' });
  const { toast } = useToast();
  
  const { tasks, loading, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
  const { signOut, user } = useAuth();

  const getCurrentUsername = async (): Promise<string> => {
    if (!user?.email) return '';

    try {
      // Intentar obtener desde la base de datos primero
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?select=username&email=eq.${encodeURIComponent(user.email)}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data[0].username;
        }
      }

      // Fallback al mapeo hardcodeado
      const emailToUsername: { [key: string]: string } = {
        'ivoezetarodriguez@gmail.com': 'Ivo',
        'enzo@example.com': 'Enzo',
        'mirella@example.com': 'Mirella',
      };
      return emailToUsername[user.email] || '';
    } catch (error) {
      console.error('Error fetching username:', error);
      // Fallback al mapeo hardcodeado
      const emailToUsername: { [key: string]: string } = {
        'ivoezetarodriguez@gmail.com': 'Ivo',
        'enzo@example.com': 'Enzo',
        'mirella@example.com': 'Mirella',
      };
      return emailToUsername[user.email] || '';
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Búsqueda por texto
      const searchMatch = !filters.search || 
        task.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.project.toLowerCase().includes(filters.search.toLowerCase());

      // Filtros específicos
      const statusMatch = !filters.status || filters.status.includes(task.status);
      const responsibleMatch = !filters.responsible || filters.responsible.includes(task.responsible);
      const priorityMatch = !filters.priority || filters.priority.includes(task.priority);
      const projectMatch = !filters.project || filters.project.includes(task.project);
      
      // Filtro por mes (maneja dueDate nulo)
      const monthMatch = !filters.month || (task.dueDate?.startsWith(filters.month) ?? false);

      return searchMatch && statusMatch && responsibleMatch && priorityMatch && projectMatch && monthMatch;
    });
  }, [tasks, filters]);

  const projects = useMemo(() => {
    return Array.from(new Set(tasks.map(task => task.project).filter(Boolean)));
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTask) {
        await updateTask({ ...editingTask, ...taskData });
        toast({
          title: "Tarea actualizada",
          description: "Los cambios se han guardado correctamente.",
        });
      } else {
        // Para nuevas tareas, obtener el username del usuario actual
        const currentUsername = await getCurrentUsername();
        const taskWithCreator = { ...taskData, createdBy: currentUsername };
        await createTask(taskWithCreator);
        toast({
          title: "Tarea creada",
          description: "La nueva tarea se ha añadido correctamente.",
        });
      }
      setEditingTask(null);
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      
      const statusLabels = {
        pending: 'Pendiente',
        'in-progress': 'En Proceso', 
        review: 'En Revisión',
        completed: 'Completada'
      };
      
      toast({
        title: "Estado actualizado",
        description: `La tarea ahora está: ${statusLabels[newStatus]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "Tarea eliminada",
        description: "La tarea se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea.",
        variant: "destructive",
      });
    }
  };

  const openNewTaskForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Task Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Centro de control de tareas • {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={openNewTaskForm}
              className="bg-primary hover:bg-primary/90 shadow-task"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="border-border"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-task-completed" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-task-in-progress" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">En Proceso</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-task-pending" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-primary rounded-full"></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <TaskFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
        />

        {/* Vista Toggle y Resultados */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {filteredTasks.length} de {tasks.length} tareas
            </span>
            {Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
              <Badge variant="secondary" className="text-xs">
                Filtrado
              </Badge>
            )}
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="cards" className="data-[state=active]:bg-primary">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-primary">
                <Table className="h-4 w-4 mr-2" />
                Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de Tareas */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-card p-8 rounded-lg border border-border inline-block">
              <p className="text-muted-foreground mb-4">No se encontraron tareas</p>
              <Button variant="outline" onClick={openNewTaskForm}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primera tarea
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ) : (
              <TaskTable
                tasks={filteredTasks}
                onEdit={handleEditTask}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            )}
          </div>
        )}

        {/* Form Modal */}
        <TaskForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          task={editingTask}
        />
      </div>
    </div>
  );
};

export default Index;