import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Activity {
  id: number;
  user: {
    id: number;
    name: string;
    avatar: string;
  };
  tarea?: {
    id: number;
    title: string;
  };
  type: string;
  description: string;
  metadata: any;
  icon: string;
  color: string;
  created_at: string;
  created_at_full: string;
}

export interface ActivityResponse {
  success: boolean;
  activities: Activity[];
  total: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private API_URL = `${environment.apiUrl}/activities`;
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Obtener headers con token de autenticación
   * Compatible con JWT y diferentes formas de almacenar el token
   */
  private getHeaders(): HttpHeaders {
    let token = '';
    
    try {
      // Intento 1: Obtener de authLocalStorage (formato típico de tu sistema)
      const authLocalStorage = localStorage.getItem('authLocalStorage');
      if (authLocalStorage) {
        const authData = JSON.parse(authLocalStorage);
        token = authData.authToken || authData.token || authData.access_token || '';
      }
      
      // Intento 2: Obtener directamente como 'token' o 'authToken'
      if (!token) {
        token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      }
      
      // Intento 3: Obtener de sessionStorage
      if (!token) {
        const sessionAuth = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        if (sessionAuth) {
          token = sessionAuth;
        }
      }
    } catch (e) {
      console.error('Error al obtener token de autenticación:', e);
    }
    
    // Si no hay token, mostrar advertencia
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación. Las peticiones fallarán.');
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener todas las actividades del usuario
   */
  getAllActivities(limit: number = 50): Observable<ActivityResponse> {
    return this.http.get<ActivityResponse>(
      `${this.API_URL}?limit=${limit}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: ActivityResponse) => {
        if (response.success && response.activities) {
          this.activitiesSubject.next(response.activities);
        }
      })
    );
  }

  /**
   * Obtener actividades de una tarea específica
   */
  getActivitiesByTarea(tareaId: number): Observable<ActivityResponse> {
    return this.http.get<ActivityResponse>(
      `${this.API_URL}/tarea/${tareaId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear una nueva actividad (comentario)
   */
  createActivity(tareaId: number, type: string, description: string, metadata: any = {}): Observable<any> {
    const body = {
      tarea_id: tareaId,
      type: type,
      description: description,
      metadata: metadata
    };

    return this.http.post<any>(
      this.API_URL,
      body,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success && response.activity) {
          // Actualizar la lista local de actividades
          const currentActivities = this.activitiesSubject.value;
          this.activitiesSubject.next([response.activity, ...currentActivities]);
        }
      })
    );
  }

  /**
   * Agregar un comentario a una tarea
   */
  addComment(tareaId: number, comment: string): Observable<any> {
    return this.createActivity(tareaId, 'comment', comment);
  }

  /**
   * Eliminar una actividad
   */
  deleteActivity(activityId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/${activityId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // Actualizar la lista local eliminando la actividad
          const currentActivities = this.activitiesSubject.value;
          const updatedActivities = currentActivities.filter(a => a.id !== activityId);
          this.activitiesSubject.next(updatedActivities);
        }
      })
    );
  }

  /**
   * Refrescar actividades
   */
  refreshActivities(limit: number = 50): void {
    this.getAllActivities(limit).subscribe({
      next: (response) => {
        console.log('✅ Actividades refrescadas:', response.total);
      },
      error: (error) => {
        console.error('❌ Error al refrescar actividades:', error);
      }
    });
  }

  /**
   * Obtener el ícono por tipo de actividad
   */
  getIconByType(type: string): string {
    const icons: {[key: string]: string} = {
      'comment': 'message-text-2',
      'status_change': 'setting-3',
      'assignment': 'profile-user',
      'attachment': 'paperclip',
      'due_date': 'calendar',
      'checklist': 'check-square',
      'created': 'plus-square',
      'completed': 'verify',
      'deleted': 'trash'
    };
    return icons[type] || 'information';
  }

  /**
   * Obtener el color por tipo de actividad
   */
  getColorByType(type: string): string {
    const colors: {[key: string]: string} = {
      'comment': 'primary',
      'status_change': 'info',
      'assignment': 'success',
      'attachment': 'warning',
      'due_date': 'danger',
      'checklist': 'primary',
      'created': 'success',
      'completed': 'success',
      'deleted': 'danger'
    };
    return colors[type] || 'secondary';
  }
}