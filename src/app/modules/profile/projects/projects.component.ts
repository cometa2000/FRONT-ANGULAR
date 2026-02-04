import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../service/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit, OnDestroy {
  
  tareas: any[] = [];
  isLoading: boolean = false;
  filterStatus: string = 'all';
  hasError: boolean = false;
  errorMessage: string = '';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // console.log('🔵 ProjectsComponent - Inicializando');
    // console.log('📊 Estado inicial - tareas:', this.tareas.length);
    this.loadTareas();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscription.unsubscribe();
  }

  /**
   * Cargar las tareas del usuario
   */
  loadTareas(forceRefresh: boolean = false): void {
    // console.log('📋 Iniciando carga de tareas... (forceRefresh:', forceRefresh, ')');
    this.isLoading = true;
    this.hasError = false;
    this.tareas = []; // ✅ Limpiar array antes de cargar
    this.cdr.detectChanges();
    
    const sub = this.profileService.getUserTareas(forceRefresh).subscribe({
      next: (response) => {
        // console.log('✅ Respuesta completa recibida:', response);
        // console.log('📋 Tipo de respuesta:', typeof response);
        // console.log('📋 Keys de respuesta:', Object.keys(response));
        
        // ✅ Validación más robusta
        if (response && response.message === 200) {
          if (response.tareas && Array.isArray(response.tareas)) {
            this.tareas = response.tareas;
            // console.log('✅ Tareas asignadas exitosamente:', this.tareas.length);
            // console.log('📋 Primera tarea (si existe):', this.tareas[0]);
          } else {
            // console.warn('⚠️ response.tareas no es un array válido:', response.tareas);
            this.tareas = [];
          }
        } else {
          // console.warn('⚠️ Respuesta con message !== 200:', response.message);
          this.tareas = [];
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        // console.log('✅ Estado final - tareas:', this.tareas.length, 'isLoading:', this.isLoading);
      },
      error: (error) => {
        // console.error('❌ Error al cargar tareas:', error);
        // console.error('❌ Error status:', error.status);
        // console.error('❌ Error message:', error.message);
        // console.error('❌ Error completo:', JSON.stringify(error));
        
        this.tareas = [];
        this.isLoading = false;
        this.hasError = true;
        
        // Mensaje de error específico
        if (error.status === 401) {
          this.errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.errorMessage = 'No se encontró el endpoint. Verifica el backend.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Revisa los logs de Laravel.';
        } else {
          this.errorMessage = 'No se pudieron cargar las tareas.';
        }
        
        this.cdr.detectChanges();
      }
    });
    
    this.subscription.add(sub);
  }

  /**
   * Refrescar tareas manualmente
   */
  refreshTareas(): void {
    // console.log('🔄 Refrescando tareas (invalidando caché)...');
    this.profileService.invalidateCache();
    this.loadTareas(true);
  }

  /**
   * Filtrar tareas por estado
   */
  get filteredTareas(): any[] {
    // console.log('🔍 Filtrando tareas. Total:', this.tareas.length, 'Filtro:', this.filterStatus);
    
    if (this.filterStatus === 'all') {
      return this.tareas;
    }
    
    const filtered = this.tareas.filter(tarea => tarea.status === this.filterStatus);
    // console.log('🔍 Tareas filtradas:', filtered.length);
    return filtered;
  }

  /**
   * Cambiar filtro de estado
   */
  onFilterChange(event: any): void {
    this.filterStatus = event.target.value;
    // console.log('🔍 Filtro cambiado a:', this.filterStatus);
    // console.log('🔍 Tareas después de filtro:', this.filteredTareas.length);
    this.cdr.detectChanges();
  }

  /**
   * Ver detalle de la tarea (modo solo lectura)
   */
  viewTarea(tarea: any): void {
    // console.log('👁️ Ver tarea:', tarea);
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

  /**
   * 🔧 Construir la URL correcta del avatar
   */
  public getAvatarUrl(avatarValue: string | null): string {
    if (!avatarValue) {
      return 'assets/media/avatars/blank.png';
    }

    // Caso: solo número "3"
    if (/^\d+$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}.png`;
    }

    // Caso: "3.png"
    if (/^\d+\.png$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}`;
    }

    // Caso: URL completa del backend (seguridad adicional)
    if (avatarValue.includes('http://') || avatarValue.includes('https://') || avatarValue.includes('storage')) {
      const file = avatarValue.split('/').pop();
      return `assets/media/avatars/${file}`;
    }

    // Caso general
    return `assets/media/avatars/${avatarValue}`;
  }

  /**
   * 🎨 Obtener avatar final del usuario
   */
  public getUserAvatar(user: any): string {
    if (!user || !user.avatar) {
      return 'assets/media/avatars/blank.png';
    }

    return this.getAvatarUrl(user.avatar);
  }

  /**
   * 🛠 Fallback en caso de error
   */
  public onAvatarError(event: any): void {
    event.target.src = 'assets/media/avatars/blank.png';
  }

}