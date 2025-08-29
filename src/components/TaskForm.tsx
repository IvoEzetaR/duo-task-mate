import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskPriority, TaskResponsible, TaskStatus } from "@/types/task";
import { Plus, X } from "lucide-react";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  task?: Task | null;
}

export function TaskForm({ isOpen, onClose, onSave, task }: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    responsible: task?.responsible || 'Ivo' as TaskResponsible,
    priority: task?.priority || 'medium' as TaskPriority,
    status: task?.status || 'pending' as TaskStatus,
    dueDate: task?.dueDate || '',
    project: task?.project || '',
    comments: task?.comments || []
  });
  
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) return;

    onSave(formData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      responsible: 'Ivo',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      project: '',
      comments: []
    });
    setNewComment('');
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      date: new Date().toLocaleDateString('es-ES')
    };
    
    setFormData(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }));
    setNewComment('');
  };

  const removeComment = (commentId: string) => {
    setFormData(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-foreground">Nombre de la Tarea *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la tarea"
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description" className="text-foreground">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe los detalles de la tarea..."
                className="bg-background border-border text-foreground min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label htmlFor="responsible" className="text-foreground">Responsable</Label>
              <Select value={formData.responsible} onValueChange={(value: TaskResponsible) => 
                setFormData(prev => ({ ...prev, responsible: value }))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ivo">Ivo</SelectItem>
                  <SelectItem value="Enzo">Enzo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority" className="text-foreground">Prioridad</Label>
              <Select value={formData.priority} onValueChange={(value: TaskPriority) => 
                setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔥 Alta</SelectItem>
                  <SelectItem value="medium">⭐ Media</SelectItem>
                  <SelectItem value="low">❄️ Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-foreground">Estado</Label>
              <Select value={formData.status} onValueChange={(value: TaskStatus) => 
                setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⚪ Pendiente</SelectItem>
                  <SelectItem value="in-progress">🟡 En Proceso</SelectItem>
                  <SelectItem value="review">🔵 En Revisión</SelectItem>
                  <SelectItem value="completed">✅ Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate" className="text-foreground">Fecha Límite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="project" className="text-foreground">Proyecto</Label>
              <Input
                id="project"
                value={formData.project}
                onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                placeholder="Ej: Marketing, Desarrollo, Cliente X"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="text-foreground">Comentarios</Label>
            <div className="space-y-3">
              {formData.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 p-3 bg-secondary/50 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{comment.date}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeComment(comment.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Agregar comentario..."
                  className="bg-background border-border text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComment}
                  className="px-3 hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}