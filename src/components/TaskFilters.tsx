import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskFilters, TaskPriority, TaskResponsible, TaskStatus } from "@/types/task";
import { Search, X, Filter } from "lucide-react";
import { useState } from "react";

interface TaskFiltersProps {
  filters: TaskFilters & { search: string };
  onFiltersChange: (filters: TaskFilters & { search: string }) => void;
  projects: string[];
}

export function TaskFiltersComponent({ filters, onFiltersChange, projects }: TaskFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof TaskFilters | 'search', value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof TaskFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({ search: filters.search || '' });
    setShowAdvanced(false);
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => key !== 'search' && filters[key as keyof TaskFilters] !== undefined
  ).length;

  return (
    <div className="space-y-4">
      {/* Búsqueda principal */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas por nombre, descripción o proyecto..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 bg-background border-border text-foreground"
        />
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="hover:bg-primary/10"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Filtros rápidos de estado */}
        <Button
          variant={filters.status?.includes('pending') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            const current = filters.status || [];
            const newValue = current.includes('pending') 
              ? current.filter(s => s !== 'pending')
              : [...current, 'pending'];
            updateFilter('status', newValue.length ? newValue : undefined);
          }}
          className="text-xs"
        >
          ⚪ Pendientes
        </Button>

        <Button
          variant={filters.status?.includes('in-progress') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            const current = filters.status || [];
            const newValue = current.includes('in-progress') 
              ? current.filter(s => s !== 'in-progress')
              : [...current, 'in-progress'];
            updateFilter('status', newValue.length ? newValue : undefined);
          }}
          className="text-xs"
        >
          🟡 En Proceso
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-lg">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Responsable</Label>
            <Select 
              value={filters.responsible?.[0] || 'all'} 
              onValueChange={(value) => updateFilter('responsible', value === 'all' ? undefined : [value as TaskResponsible])}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ivo">Ivo</SelectItem>
                <SelectItem value="Enzo">Enzo</SelectItem>
                <SelectItem value="Mirella">Mirella</SelectItem>
              </SelectContent>
            </Select>
            {filters.responsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('responsible')}
                className="text-xs text-muted-foreground hover:text-destructive mt-1 h-6 p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Prioridad</Label>
            <Select 
              value={filters.priority?.[0] || 'all'} 
              onValueChange={(value) => updateFilter('priority', value === 'all' ? undefined : [value as TaskPriority])}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">🔥 Alta</SelectItem>
                <SelectItem value="medium">⭐ Media</SelectItem>
                <SelectItem value="low">❄️ Baja</SelectItem>
              </SelectContent>
            </Select>
            {filters.priority && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('priority')}
                className="text-xs text-muted-foreground hover:text-destructive mt-1 h-6 p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Proyecto</Label>
            <Select 
              value={filters.project?.[0] || 'all'} 
              onValueChange={(value) => updateFilter('project', value === 'all' ? undefined : [value])}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">Todos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.project && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('project')}
                className="text-xs text-muted-foreground hover:text-destructive mt-1 h-6 p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Filtrar por Mes</Label>
            <Select 
              value={filters.month || 'all'} 
              onValueChange={(value) => updateFilter('month', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="all">Todos los meses</SelectItem>
                <SelectItem value="2025-01">Enero 2025</SelectItem>
                <SelectItem value="2025-02">Febrero 2025</SelectItem>
                <SelectItem value="2025-03">Marzo 2025</SelectItem>
                <SelectItem value="2025-04">Abril 2025</SelectItem>
                <SelectItem value="2025-05">Mayo 2025</SelectItem>
                <SelectItem value="2025-06">Junio 2025</SelectItem>
                <SelectItem value="2025-07">Julio 2025</SelectItem>
                <SelectItem value="2025-08">Agosto 2025</SelectItem>
                <SelectItem value="2025-09">Septiembre 2025</SelectItem>
                <SelectItem value="2025-10">Octubre 2025</SelectItem>
                <SelectItem value="2025-11">Noviembre 2025</SelectItem>
                <SelectItem value="2025-12">Diciembre 2025</SelectItem>
              </SelectContent>
            </Select>
            {filters.month && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter('month')}
                className="text-xs text-muted-foreground hover:text-destructive mt-1 h-6 p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}