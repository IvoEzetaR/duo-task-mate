import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, User } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
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

export function TaskCard({ task, onEdit, onStatusChange, onDelete }: TaskCardProps) {
  const statusInfo = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];

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
    <Card className="bg-gradient-card border-border shadow-card hover:shadow-task transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground leading-tight">
            {task.name}
          </CardTitle>
          <div className="flex flex-col gap-2 items-end">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-medium border",
                `text-${statusInfo.color} border-${statusInfo.color}/20`
              )}
            >
              {statusInfo.emoji} {statusInfo.label}
            </Badge>
            <Badge 
              variant="outline"
              className={cn(
                "text-xs font-medium border",
                `text-${priorityInfo.color} border-${priorityInfo.color}/20`
              )}
            >
              {priorityInfo.emoji} {priorityInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="font-medium text-foreground">{task.responsible}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="font-medium text-foreground">{task.dueDate}</span>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-md p-2">
          <span className="text-xs font-medium text-muted-foreground">Proyecto:</span>
          <p className="text-sm text-foreground mt-1">{task.project}</p>
        </div>

        {task.comments.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>{task.comments.length} comentario{task.comments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(task)}
          className="flex-1 hover:bg-primary/10 hover:border-primary/50"
        >
          Editar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {statusConfig[getNextStatus(task.status)].emoji} Siguiente
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="px-3"
        >
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
}