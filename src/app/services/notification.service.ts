import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Notification {
  id: number;
  from_user?: {
    id: number;
    name: string;
    avatar: string;
  };
  tarea?: {
    id: number;
    title: string;
  };
  grupo?: {
    id: number;
    name: string;
  };
  type: string;
  title: string;
  message: string;
  data: any;
  icon: string;
  color: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  created_at_full: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  unread_count: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private API_URL = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {
    // Actualizar notificaciones cada 30 segundos
    this.startAutoRefresh();
  }

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
   * Iniciar actualización automática de notificaciones
   */
  private startAutoRefresh(): void {
    // Actualizar cada 30 segundos
    interval(30000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.getUnreadCount().subscribe({
          next: () => {
            // Actualización exitosa
          },
          error: (error) => {
            // Solo mostrar error si no es 401 (usuario no autenticado)
            if (error.status !== 401) {
              console.error('Error al actualizar contador de notificaciones:', error);
            }
          }
        });
      });
  }

  /**
   * Obtener todas las notificaciones
   */
  getAllNotifications(limit: number = 20, unreadOnly: boolean = false): Observable<NotificationResponse> {
    const params = `?limit=${limit}&unread_only=${unreadOnly}`;
    
    return this.http.get<NotificationResponse>(
      `${this.API_URL}${params}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: NotificationResponse) => {
        if (response.success && response.notifications) {
          this.notificationsSubject.next(response.notifications);
          this.unreadCountSubject.next(response.unread_count || 0);
        }
      })
    );
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  getUnreadCount(): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/unread-count`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          this.unreadCountSubject.next(response.unread_count || 0);
        }
      })
    );
  }

  /**
   * Marcar una notificación como leída
   */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/${notificationId}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // Actualizar la notificación en la lista local
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Actualizar contador
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        }
      })
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  markAllAsRead(): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/read-all`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // Actualizar todas las notificaciones locales
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            ({ ...n, is_read: true, read_at: new Date().toISOString() })
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Resetear contador
          this.unreadCountSubject.next(0);
        }
      })
    );
  }

  /**
   * Eliminar una notificación
   */
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/${notificationId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // Eliminar de la lista local
          const notifications = this.notificationsSubject.value;
          const notification = notifications.find(n => n.id === notificationId);
          const updatedNotifications = notifications.filter(n => n.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
          
          // Actualizar contador si era no leída
          if (notification && !notification.is_read) {
            const currentCount = this.unreadCountSubject.value;
            this.unreadCountSubject.next(Math.max(0, currentCount - 1));
          }
        }
      })
    );
  }

  /**
   * Eliminar todas las notificaciones leídas
   */
  deleteAllRead(): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/delete-read`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // Mantener solo las no leídas
          const notifications = this.notificationsSubject.value;
          const unreadNotifications = notifications.filter(n => !n.is_read);
          this.notificationsSubject.next(unreadNotifications);
        }
      })
    );
  }

  /**
   * Refrescar notificaciones
   */
  refreshNotifications(limit: number = 20): void {
    this.getAllNotifications(limit).subscribe({
      next: (response) => {
        console.log('✅ Notificaciones refrescadas:', response.total);
      },
      error: (error) => {
        console.error('❌ Error al refrescar notificaciones:', error);
      }
    });
  }

  /**
   * Obtener el ícono por tipo de notificación
   */
  getIconByType(type: string): string {
    const icons: {[key: string]: string} = {
      'task_assigned': 'profile-user',
      'task_completed': 'verify',
      'comment': 'message-text-2',
      'mention': 'notification-status',
      'due_date_reminder': 'calendar',
      'permission_changed': 'security-user',
      'attachment': 'paperclip'
    };
    return icons[type] || 'information';
  }

  /**
   * Obtener el color por tipo de notificación
   */
  getColorByType(type: string): string {
    const colors: {[key: string]: string} = {
      'task_assigned': 'success',
      'task_completed': 'success',
      'comment': 'primary',
      'mention': 'warning',
      'due_date_reminder': 'danger',
      'permission_changed': 'info',
      'attachment': 'warning'
    };
    return colors[type] || 'secondary';
  }
}