import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Task, TaskPriority, TaskResponsible, TaskStatus, TaskPrivacy } from "@/types/task";
import { Plus, X } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";

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
    privacy: task?.privacy || 'general' as TaskPrivacy,
    sharedWith: task?.sharedWith || [],
    comments: task?.comments || [],
    createdBy: task?.createdBy || ''
  });

  const [newComment, setNewComment] = useState('');
  const [newSharedUser, setNewSharedUser] = useState('');
  const { users: availableUsers } = useUsers();

  // availableUsers se carga y cachea desde useUsers()

  // Update form data when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        responsible: task.responsible || 'Ivo',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate || '',
        project: task.project || '',
        privacy: task.privacy || 'general',
        sharedWith: task.sharedWith || [],
        comments: task.comments || [],
        createdBy: task.createdBy || ''
      });
    } else {
      // Reset form for new task
      setFormData({
        name: '',
        description: '',
        responsible: 'Ivo',
        priority: 'medium',
        status: 'pending',
        dueDate: '',
        project: '',
        privacy: 'general',
        sharedWith: [],
        comments: [],
        createdBy: ''
      });
    }
    setNewComment('');
    setNewSharedUser('');
  }, [task, isOpen]);

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
      privacy: 'general',
      sharedWith: [],
      comments: [],
      createdBy: ''
    });
    setNewComment('');
    setNewSharedUser('');
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD para la base de datos
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

  const addSharedUser = () => {
    if (!newSharedUser.trim() || formData.sharedWith.includes(newSharedUser.trim())) return;

    // Verificar que el usuario existe en la lista de usuarios disponibles
    const userExists = availableUsers.some(user => user.username === newSharedUser.trim());
    if (!userExists) {
      console.error('Usuario no encontrado:', newSharedUser.trim());
      return;
    }

    setFormData(prev => ({
      ...prev,
      sharedWith: [...prev.sharedWith, newSharedUser.trim()]
    }));
    setNewSharedUser('');
  };

  const removeSharedUser = (username: string) => {
    setFormData(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.filter(u => u !== username)
    }));
  };

  const privacyLabel: Record<TaskPrivacy, string> = {
    private: '🔒 Privada',
    general: '🌐 General',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible bg-card border-border">
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
                <SelectContent className="bg-popover border-border z-50">
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username}
                    </SelectItem>
                  ))}
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
                <SelectContent className="bg-popover border-border z-50">
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
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="pending">⚪ Pendiente</SelectItem>
                  <SelectItem value="in-progress">🟡 En Proceso</SelectItem>
                  <SelectItem value="review">🔵 En Revisión</SelectItem>
                  <SelectItem value="completed">✅ Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="privacy" className="text-foreground">Privacidad</Label>
              <Select
                value={formData.privacy}
                onValueChange={(value: TaskPrivacy) => {
                  setFormData(prev => {
                    // Si cambiamos a privado y no hay usuarios compartidos, asegurarnos de que sharedWith sea un array vacío
                    // Si cambiamos a general, limpiar la lista de compartidos
                    const newSharedWith = value === 'general' ? [] : prev.sharedWith;
                    return {
                      ...prev,
                      privacy: value,
                      sharedWith: newSharedWith
                    };
                  });
                }}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Seleccionar privacidad">
                    {privacyLabel[formData.privacy as TaskPrivacy]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border z-[9999]"
                  position="popper"
                  side="bottom"
                  align="start"
                >
                  <SelectItem value="private">🔒 Privada</SelectItem>
                  <SelectItem value="general">🌐 General</SelectItem>
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

            {formData.privacy === 'private' && (
              <div className="col-span-2">
                <Label className="text-foreground">Usuarios Compartidos</Label>
                <div className="space-y-3">
                  {formData.sharedWith.map((username) => (
                    <div key={username} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                      <span className="text-sm text-foreground flex-1">{username}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSharedUser(username)}
                        className="h-6 w-6 p-0 hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Select value={newSharedUser} onValueChange={setNewSharedUser}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Seleccionar usuario..." />
                      </SelectTrigger>
                      <SelectContent position="item-aligned" className="bg-popover border-border z-[9999]">
                        {availableUsers
                          .filter(user => !formData.sharedWith.includes(user.username))
                          .map(user => (
                            <SelectItem key={user.id} value={user.username}>
                              {user.username}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSharedUser}
                      className="px-3 hover:bg-primary/10"
                      disabled={!newSharedUser}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-foreground">Comentarios</Label>
            <div className="space-y-3">
              {formData.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 p-3 bg-secondary/50 rounded-md">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{comment.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.date).toLocaleDateString('es-ES')}
                    </p>
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