import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {
  
  tareas: any[] = [];
  isLoading: boolean = false;
  filterStatus: string = 'all';

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔵 ProjectsComponent - Inicializando');
    this.loadTareas();
  }

  /**
   * Cargar las tareas del usuario
   */
  loadTareas(): void {
    console.log('📋 Iniciando carga de tareas...');
    this.isLoading = true;
    this.cdr.detectChanges(); // Forzar detección de cambios
    
    this.profileService.getUserTareas().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        if (response.message === 200 && response.tareas) {
          this.tareas = response.tareas;
          console.log('📋 Tareas asignadas:', this.tareas.length);
        } else {
          console.warn('⚠️ Respuesta sin tareas válidas');
          this.tareas = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios después de actualizar
        console.log('✅ Estado de carga actualizado a false');
      },
      error: (error) => {
        console.error('❌ Error al cargar tareas:', error);
        this.tareas = [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios en caso de error
      }
    });
  }

  /**
   * Filtrar tareas por estado
   */
  get filteredTareas(): any[] {
    if (this.filterStatus === 'all') {
      return this.tareas;
    }
    return this.tareas.filter(tarea => tarea.status === this.filterStatus);
  }

  /**
   * Cambiar filtro de estado
   */
  onFilterChange(event: any): void {
    this.filterStatus = event.target.value;
    console.log('🔍 Filtro cambiado a:', this.filterStatus);
  }

  /**
   * Ver detalle de la tarea (modo solo lectura)
   */
  viewTarea(tarea: any): void {
    console.log('👁️ Ver tarea:', tarea);
    // Navegar a la vista de edición de tarea con modo lectura
    this.router.navigate(['/tasks/tareas/edit', tarea.id], {
      queryParams: { readonly: true }
    });
  }

  /**
   * Obtener color del badge según el estado
   */
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'completada':
        return 'success';
      case 'en_progreso':
        return 'primary';
      case 'pendiente':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtener texto del estado en español
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'completada':
        return 'Completada';
      case 'en_progreso':
        return 'En Progreso';
      case 'pendiente':
        return 'Pendiente';
      default:
        return status;
    }
  }

  /**
   * Obtener color del badge según la prioridad
   */
  getPriorityBadgeColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtener texto de la prioridad en español
   */
  getPriorityText(priority: string): string {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority;
    }
  }

  /**
   * Formatear fecha
   */
  formatDate(date: string): string {
    if (!date) return 'Sin fecha';
    
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return d.toLocaleDateString('es-MX', options);
  }

  /**
   * Verificar si la tarea está vencida
   */
  isOverdue(tarea: any): boolean {
    return tarea.is_overdue === true;
  }

  /**
   * Verificar si la fecha de vencimiento está cerca
   */
  isDueSoon(tarea: any): boolean {
    return tarea.is_due_soon === true;
  }
}