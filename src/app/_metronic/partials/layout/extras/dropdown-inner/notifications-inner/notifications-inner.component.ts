import { Component, HostBinding, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ✅ Primero configurar las suscripciones
    this.subscription.add(
      this.notificationService.notifications$.subscribe((notifications: Notification[]) => {
        this.notifications = notifications;
        this.updateNotificationLists();
        // ✅ CRÍTICO: Forzar detección de cambios
        this.cdr.detectChanges();
      })
    );

    this.subscription.add(
      this.notificationService.unreadCount$.subscribe((count: number) => {
        this.unreadCount = count;
        // ✅ CRÍTICO: Forzar detección de cambios
        this.cdr.detectChanges();
      })
    );

    // ✅ Luego cargar las notificaciones
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * ✅ Cargar notificaciones con detección de cambios forzada
   */
  loadNotifications(): void {
    this.isLoading = true;
    this.error = '';
    
    // ✅ Forzar detección de cambios después de establecer isLoading
    this.cdr.detectChanges();
    
    this.notificationService.getAllNotifications(20).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response.success) {
          console.log('✅ Notificaciones cargadas:', response.total);
        } else {
          this.error = response.error || 'Error al cargar las notificaciones';
        }
        
        // ✅ CRÍTICO: Forzar detección de cambios después de recibir respuesta
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar notificaciones:', error);
        this.error = 'Error al cargar las notificaciones';
        this.isLoading = false;
        
        // ✅ CRÍTICO: Forzar detección de cambios en caso de error
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * ✅ Actualizar listas de notificaciones con detección de cambios
   */
  updateNotificationLists(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.is_read);
    this.readNotifications = this.notifications.filter(n => n.is_read);
    
    console.log('📊 Listas actualizadas:', {
      total: this.notifications.length,
      unread: this.unreadNotifications.length,
      read: this.readNotifications.length
    });
  }

  /**
   * Cambiar tab activo
   */
  setActiveTabId(tabId: NotificationsTabsType): void {
    this.activeTabId = tabId;
    this.cdr.detectChanges();
  }

  /**
   * ✅ Marcar notificación como leída con detección de cambios
   */
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('✅ Notificación marcada como leída:', notification.id);
            // Las listas se actualizarán automáticamente vía la suscripción
            // pero forzamos la detección por si acaso
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('Error al marcar notificación:', error);
        }
      });
    }
  }

  /**
   * ✅ Marcar todas como leídas con detección de cambios
   */
  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    
    this.notificationService.markAllAsRead().subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('✅ Todas las notificaciones marcadas como leídas');
          // Las listas se actualizarán automáticamente vía la suscripción
          this.cdr.detectChanges();
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
            console.log('✅ Notificación eliminada');
            this.cdr.detectChanges();
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
            console.log('✅ Notificaciones leídas eliminadas');
            this.cdr.detectChanges();
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