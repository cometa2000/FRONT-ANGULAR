import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivityService, Activity } from 'src/app/services/activity.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-drawer',
  templateUrl: './activity-drawer.component.html',
})
export class ActivityDrawerComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  isLoading: boolean = false;
  error: string = '';
  private subscription: Subscription = new Subscription();

  // Hacer que Object.keys esté disponible en el template
  Object = Object;

  constructor(
    private activityService: ActivityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActivities();
    
    // Suscribirse a cambios en las actividades
    this.subscription.add(
      this.activityService.activities$.subscribe((activities: Activity[]) => {
        this.activities = activities;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Cargar actividades
   */
  loadActivities(): void {
    this.isLoading = true;
    this.error = '';
    
    this.activityService.getAllActivities(50).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.activities = response.activities;
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar actividades:', error);
        this.error = 'Error al cargar las actividades';
        this.isLoading = false;
      }
    });
  }

  /**
   * Ir a la tarea
   */
  goToTarea(tareaId: number): void {
    // Cerrar el drawer
    const closeButton = document.getElementById('kt_activities_close');
    if (closeButton) {
      closeButton.click();
    }
    
    // Navegar a la tarea (ajustar la ruta según tu estructura)
    this.router.navigate(['/tasks/tareas', tareaId]);
  }

  /**
   * Refrescar actividades
   */
  refresh(): void {
    this.loadActivities();
  }

  /**
   * Obtener clase CSS para el ícono según el tipo
   */
  getIconClass(activity: Activity): string {
    return `bg-light-${activity.color}`;
  }

  /**
   * Obtener clase CSS para el badge
   */
  getBadgeClass(type: string): string {
    const activity = this.activities.find(a => a.type === type);
    return activity ? `badge-light-${activity.color}` : 'badge-light';
  }

  /**
   * Formatear descripción de actividad
   */
  getActivityDescription(activity: Activity): string {
    if (activity.type === 'comment') {
      return activity.description;
    }
    
    return `${activity.user.name} ${activity.description}`;
  }

  /**
   * Obtener texto del tipo de actividad
   */
  getActivityTypeText(type: string): string {
    const types: {[key: string]: string} = {
      'comment': 'Comentario',
      'status_change': 'Cambio de estado',
      'assignment': 'Asignación',
      'attachment': 'Adjunto',
      'due_date': 'Fecha de vencimiento',
      'checklist': 'Checklist',
      'created': 'Creación',
      'completed': 'Completada',
      'deleted': 'Eliminada'
    };
    return types[type] || type;
  }
}