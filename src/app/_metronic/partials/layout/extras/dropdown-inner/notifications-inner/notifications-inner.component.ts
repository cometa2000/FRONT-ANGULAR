import { Component, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, Notification } from 'src/app/services/notification.service';
import { Subscription } from 'rxjs';

export type NotificationsTabsType =
  | 'kt_topbar_notifications_1'
  | 'kt_topbar_notifications_2'
  | 'kt_topbar_notifications_3';

@Component({
  selector: 'app-notifications-inner',
  templateUrl: './notifications-inner.component.html',
})
export class NotificationsInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class') class =
    'menu menu-sub menu-sub-dropdown menu-column w-350px w-lg-375px';
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  activeTabId: NotificationsTabsType = 'kt_topbar_notifications_1';
  notifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  readNotifications: Notification[] = [];
  unreadCount: number = 0;
  isLoading: boolean = false;
  error: string = '';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    
    // ✅ Suscribirse a cambios en notificaciones del servicio
    this.subscription.add(
      this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
        this.notifications = notifications;
        this.updateNotificationLists();
      })
    );

    // ✅ Suscribirse al contador de no leídas
    this.subscription.add(
      this.notificationService.unreadCount$.subscribe((count: number) => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * ✅ CORRECCIÓN: Cargar notificaciones siempre establece isLoading = false
   */
  loadNotifications(): void {
    this.isLoading = true;
    this.error = '';
    
    this.notificationService.getAllNotifications(20).subscribe({
      next: (response: any) => {
        // ✅ Establecer isLoading = false SIEMPRE, independientemente del success
        this.isLoading = false;
        
        if (response.success) {
          // Los datos ya fueron actualizados por el BehaviorSubject
          // Solo verificamos que tengamos datos
          console.log('✅ Notificaciones cargadas:', response.total);
        } else {
          this.error = response.error || 'Error al cargar las notificaciones';
        }
      },
      error: (error: any) => {
        console.error('Error al cargar notificaciones:', error);
        this.error = 'Error al cargar las notificaciones';
        this.isLoading = false; // ✅ También establecer en false en error
      }
    });
  }

  /**
   * Actualizar listas de notificaciones leídas y no leídas
   */
  updateNotificationLists(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.is_read);
    this.readNotifications = this.notifications.filter(n => n.is_read);
  }

  /**
   * Cambiar tab activo
   */
  setActiveTabId(tabId: NotificationsTabsType): void {
    this.activeTabId = tabId;
  }

  /**
   * ✅ CORRECCIÓN: Marcar notificación como leída sin eliminarla de la lista
   */
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response: any) => {
          if (response.success) {
            // ✅ La notificación se actualizará automáticamente via BehaviorSubject
            console.log('✅ Notificación marcada como leída');
          }
        },
        error: (error: any) => {
          console.error('Error al marcar notificación:', error);
        }
      });
    }
  }

  /**
   * ✅ CORRECCIÓN: Marcar todas como leídas sin eliminarlas
   */
  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    
    this.notificationService.markAllAsRead().subscribe({
      next: (response: any) => {
        if (response.success) {
          // ✅ Las notificaciones se actualizarán automáticamente via BehaviorSubject
          console.log('✅ Todas las notificaciones marcadas como leídas');
        }
      },
      error: (error: any) => {
        console.error('Error al marcar todas las notificaciones:', error);
      }
    });
  }

  /**
   * Eliminar notificación
   */
  deleteNotification(notificationId: number, event: Event): void {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de eliminar esta notificación?')) {
      this.notificationService.deleteNotification(notificationId).subscribe({
        next: (response: any) => {
          if (response.success) {
            // ✅ La notificación se eliminará automáticamente via BehaviorSubject
            console.log('✅ Notificación eliminada');
          }
        },
        error: (error: any) => {
          console.error('Error al eliminar notificación:', error);
        }
      });
    }
  }

  /**
   * Eliminar todas las leídas
   */
  deleteAllRead(): void {
    if (this.readNotifications.length === 0) return;
    
    if (confirm('¿Estás seguro de eliminar todas las notificaciones leídas?')) {
      this.notificationService.deleteAllRead().subscribe({
        next: (response: any) => {
          if (response.success) {
            // ✅ Las notificaciones se actualizarán automáticamente via BehaviorSubject
            console.log('✅ Notificaciones leídas eliminadas');
          }
        },
        error: (error: any) => {
          console.error('Error al eliminar notificaciones:', error);
        }
      });
    }
  }

  /**
   * Ir a la tarea de la notificación
   */
  goToTarea(notification: Notification): void {
    // Marcar como leída
    if (!notification.is_read) {
      this.markAsRead(notification);
    }
    
    // Navegar si tiene tarea
    if (notification.tarea) {
      this.router.navigate(['/tasks/tareas', notification.tarea.id]);
    }
  }

  /**
   * Refrescar notificaciones
   */
  refresh(): void {
    this.loadNotifications();
  }

  /**
   * Obtener clase del ícono
   */
  getIconClass(notification: Notification): string {
    return `bg-light-${notification.color}`;
  }

  /**
   * Obtener clase del badge
   */
  getBadgeClass(notification: Notification): string {
    return notification.is_read ? 'badge-light' : `badge-light-${notification.color}`;
  }
}