import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { tap, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
    this.startAutoRefresh();
  }

  private getHeaders(): HttpHeaders {
    let token = '';
    
    try {
      const authLocalStorage = localStorage.getItem('authLocalStorage');
      if (authLocalStorage) {
        const authData = JSON.parse(authLocalStorage);
        token = authData.authToken || authData.token || authData.access_token || '';
      }
      
      if (!token) {
        token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      }
      
      if (!token) {
        const sessionAuth = sessionStorage.getItem('authToken') || sessionStorage.getItem('token');
        if (sessionAuth) {
          token = sessionAuth;
        }
      }
    } catch (e) {
      console.error('❌ Error al obtener token:', e);
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private startAutoRefresh(): void {
    interval(30000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.getUnreadCount().subscribe({
          next: () => {},
          error: (error) => {
            if (error.status !== 401) {
              console.error('❌ Error al actualizar contador:', error);
            }
          }
        });
      });
  }

  getAllNotifications(limit: number = 20, unreadOnly: boolean = false): Observable<NotificationResponse> {
    const params = `?limit=${limit}&unread_only=${unreadOnly}`;
    
    return this.http.get<NotificationResponse>(
      `${this.API_URL}${params}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: NotificationResponse) => {
        console.log('🔥 Respuesta del servidor:', response);
        if (response.success && response.notifications) {
          // ✅ Actualizar el estado con las notificaciones recibidas
          this.notificationsSubject.next(response.notifications);
          this.unreadCountSubject.next(response.unread_count || 0);
          
          console.log('✅ BehaviorSubjects actualizados:', {
            total: response.notifications.length,
            unread: response.unread_count
          });
        }
      }),
      catchError((error) => {
        console.error('❌ Error al obtener notificaciones:', error);
        return of({
          success: false,
          notifications: [],
          total: 0,
          unread_count: 0,
          error: error.message
        });
      })
    );
  }

  getUnreadCount(): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/unread-count`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          this.unreadCountSubject.next(response.unread_count || 0);
        }
      }),
      catchError((error) => {
        if (error.status !== 401) {
          console.error('❌ Error al obtener contador:', error);
        }
        return of({ success: false, unread_count: 0 });
      })
    );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/${notificationId}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // ✅ Actualizar el array sin eliminar la notificación
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() } 
              : n
          );
          
          // ✅ Emitir el nuevo array
          this.notificationsSubject.next(updatedNotifications);
          
          // ✅ Actualizar contador
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
          
          console.log('✅ Notificación marcada como leída:', {
            id: notificationId,
            newCount: this.unreadCountSubject.value
          });
        }
      }),
      catchError((error) => {
        console.error('❌ Error al marcar como leída:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(
      `${this.API_URL}/read-all`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          // ✅ Actualizar todas las notificaciones sin eliminarlas
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map(n => 
            ({ ...n, is_read: true, read_at: new Date().toISOString() })
          );
          
          // ✅ Emitir el nuevo array
          this.notificationsSubject.next(updatedNotifications);
          
          // ✅ Contador a 0
          this.unreadCountSubject.next(0);
          
          console.log('✅ Todas las notificaciones marcadas como leídas:', {
            total: updatedNotifications.length,
            unreadCount: 0
          });
        }
      }),
      catchError((error) => {
        console.error('❌ Error al marcar todas como leídas:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/${notificationId}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          const notifications = this.notificationsSubject.value;
          const notification = notifications.find(n => n.id === notificationId);
          const updatedNotifications = notifications.filter(n => n.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
          
          if (notification && !notification.is_read) {
            const currentCount = this.unreadCountSubject.value;
            this.unreadCountSubject.next(Math.max(0, currentCount - 1));
          }
          
          console.log('✅ Notificación eliminada:', notificationId);
        }
      }),
      catchError((error) => {
        console.error('❌ Error al eliminar notificación:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  deleteAllRead(): Observable<any> {
    return this.http.delete<any>(
      `${this.API_URL}/delete-read`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response.success) {
          const notifications = this.notificationsSubject.value;
          const unreadNotifications = notifications.filter(n => !n.is_read);
          this.notificationsSubject.next(unreadNotifications);
          
          console.log('✅ Notificaciones leídas eliminadas');
        }
      }),
      catchError((error) => {
        console.error('❌ Error al eliminar leídas:', error);
        return of({ success: false, error: error.message });
      })
    );
  }

  refreshNotifications(limit: number = 20): void {
    this.getAllNotifications(limit).subscribe({
      next: (response) => {
        console.log('✅ Notificaciones refrescadas:', response.total);
      },
      error: (error) => {
        console.error('❌ Error al refrescar:', error);
      }
    });
  }

  getIconByType(type: string): string {
    const icons: {[key: string]: string} = {
      'task_assigned': 'profile-user',
      'task_completed': 'verify',
      'group_created': 'element-11',
      'group_shared_owner': 'security-user',
      'group_shared_invited': 'security-user',
      'task_due_soon': 'calendar',
      'task_overdue': 'calendar',
      'comment': 'message-text-2',
      'mention': 'notification-status',
      'due_date_reminder': 'calendar',
      'permission_changed': 'security-user',
      'attachment': 'paperclip'
    };
    return icons[type] || 'information';
  }

  getColorByType(type: string): string {
    const colors: {[key: string]: string} = {
      'task_assigned': 'success',
      'task_completed': 'success',
      'group_created': 'info',
      'group_shared_owner': 'info',
      'group_shared_invited': 'primary',
      'task_due_soon': 'warning',
      'task_overdue': 'danger',
      'comment': 'primary',
      'mention': 'warning',
      'due_date_reminder': 'danger',
      'permission_changed': 'info',
      'attachment': 'warning'
    };
    return colors[type] || 'secondary';
  }
}