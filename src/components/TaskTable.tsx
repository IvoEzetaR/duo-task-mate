import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { Edit, MessageSquare } from "lucide-react";

interface TaskTableProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onDelete: (taskId: string) => void;
}

const statusConfig = {
  pending: { emoji: '⚪', label: 'Pendiente', color: 'task-pending' },
  'in-progress': { emoji: '🟡', label: 'En Proceso', color: 'task-in-progress' },
  review: { emoji: '🔵', label: 'En Revisión', color: 'task-review' },
  completed: { emoji: '✅', label: 'Completada', color: 'task-completed' }
};

const priorityConfig = {
  high: { emoji: '🔥', label: 'Alta', color: 'priority-high' },
  medium: { emoji: '⭐', label: 'Media', color: 'priority-medium' },
  low: { emoji: '❄️', label: 'Baja', color: 'priority-low' }
};

export function TaskTable({ tasks, onEdit, onStatusChange, onDelete }: TaskTableProps) {
  const getNextStatus = (currentStatus: Task['status']): Task['status'] => {
    const statusFlow: Record<Task['status'], Task['status']> = {
      'pending': 'in-progress',
      'in-progress': 'review',
      'review': 'completed',
      'completed': 'pending'
    };
    return statusFlow[currentStatus];
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground" scope="col">Tarea</TableHead>
            <TableHead className="font-semibold text-foreground" scope="col">Estado</TableHead>
            <TableHead className="font-semibold text-foreground" scope="col">Responsable</TableHead>
            <TableHead className="font-semibold text-foreground" scope="col">Prioridad</TableHead>
            <TableHead className="font-semibold text-foreground" scope="col">Fecha Límite</TableHead>
            <TableHead className="font-semibold text-foreground" scope="col">Proyecto</TableHead>
            <TableHead className="font-semibold text-foreground text-center" scope="col">Comentarios</TableHead>
            <TableHead className="font-semibold text-foreground text-center" scope="col">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const statusInfo = statusConfig[task.status];
            const priorityInfo = priorityConfig[task.priority];
            
            return (
              <TableRow key={task.id} className="border-border hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold text-foreground">{task.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium border",
                      statusInfo.color === 'task-pending' && "text-[hsl(var(--task-pending))] border-[hsl(var(--task-pending))/20]",
                      statusInfo.color === 'task-in-progress' && "text-[hsl(var(--task-in-progress))] border-[hsl(var(--task-in-progress))/20]",
                      statusInfo.color === 'task-review' && "text-[hsl(var(--task-review))] border-[hsl(var(--task-review))/20]",
                      statusInfo.color === 'task-completed' && "text-[hsl(var(--task-completed))] border-[hsl(var(--task-completed))/20]"
                    )}
                  >
                    {statusInfo.emoji} {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {task.responsible}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border",
                      priorityInfo.color === 'priority-high' && "text-[hsl(var(--priority-high))] border-[hsl(var(--priority-high))/20]",
                      priorityInfo.color === 'priority-medium' && "text-[hsl(var(--priority-medium))] border-[hsl(var(--priority-medium))/20]",
                      priorityInfo.color === 'priority-low' && "text-[hsl(var(--priority-low))] border-[hsl(var(--priority-low))/20]"
                    )}
                  >
                    {priorityInfo.emoji} {priorityInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">
                  {task.dueDate}
                </TableCell>
                <TableCell className="text-foreground">
                  {task.project}
                </TableCell>
                <TableCell className="text-center">
                  {task.comments.length > 0 && (
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-xs">{task.comments.length}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                      aria-label={`Editar tarea: ${task.name}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
                      className="h-8 px-2 text-xs hover:bg-primary/10"
                      aria-label={`Cambiar estado de ${task.name} a ${statusConfig[getNextStatus(task.status)].label}`}
                    >
                      {statusConfig[getNextStatus(task.status)].emoji}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(task.id)}
                      className="h-8 px-2 text-xs"
                      aria-label={`Eliminar tarea: ${task.name}`}
                    >
                      🗑️
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}