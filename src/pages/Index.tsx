import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCard } from "@/components/TaskCard";
import { TaskTable } from "@/components/TaskTable";
import { TaskForm } from "@/components/TaskForm";
import { TaskFiltersComponent } from "@/components/TaskFilters";
import { Task, TaskFilters } from "@/types/task";
import { Plus, Grid3X3, Table, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sampleTasks: Task[] = [
  {
    id: '1',
    name: 'Diseñar el logo de la empresa',
    status: 'in-progress',
    description: 'Crear un logo moderno y atractivo que represente los valores de la empresa. Debe incluir variaciones para fondo claro y oscuro.',
    responsible: 'Ivo',
    priority: 'high',
    dueDate: '2024-01-15',
    project: 'Branding',
    comments: [
      { id: '1', text: 'Revisar colores corporativos', date: '10/01/2024' }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Implementar sistema de autenticación',
    status: 'pending',
    description: 'Desarrollar un sistema de login y registro seguro para la aplicación web.',
    responsible: 'Enzo',
    priority: 'high',
    dueDate: '2024-01-20',
    project: 'Desarrollo',
    comments: [],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05'
  },
  {
    id: '3',
    name: 'Crear contenido para redes sociales',
    status: 'completed',
    description: 'Planificar y crear posts para Instagram, Facebook y LinkedIn durante el mes de enero.',
    responsible: 'Ivo',
    priority: 'medium',
    dueDate: '2024-01-12',
    project: 'Marketing',
    comments: [
      { id: '2', text: 'Posts programados hasta el 15/01', date: '12/01/2024' }
    ],
    createdAt: '2024-01-02',
    updatedAt: '2024-01-12'
  }
];

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filters, setFilters] = useState<TaskFilters & { search: string }>({ search: '' });
  const { toast } = useToast();

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

      return searchMatch && statusMatch && responsibleMatch && priorityMatch && projectMatch;
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

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    
    if (editingTask) {
      // Editar tarea existente
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...taskData, updatedAt: now }
          : task
      ));
      toast({
        title: "Tarea actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    } else {
      // Nueva tarea
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now
      };
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Tarea creada",
        description: "La nueva tarea se ha añadido correctamente.",
      });
    }
    
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ));
    
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
  };

  const openNewTaskForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

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
              Centro de control de tareas para Ivo y Enzo
            </p>
          </div>
          <Button 
            onClick={openNewTaskForm}
            className="bg-primary hover:bg-primary/90 shadow-task"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
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
                  />
                ))}
              </div>
            ) : (
              <TaskTable
                tasks={filteredTasks}
                onEdit={handleEditTask}
                onStatusChange={handleStatusChange}
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