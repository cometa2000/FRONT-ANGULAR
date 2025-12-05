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

  user: any = null;

  
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando componente de notificaciones');
    
    // ✅ CRÍTICO: Suscribirse ANTES de cargar para capturar todos los eventos
    this.subscription.add(
      this.notificationService.notifications$.subscribe({
        next: (notifications: Notification[]) => {
          console.log('📥 Notificaciones recibidas en componente:', notifications.length);
          this.notifications = notifications;
          this.updateNotificationLists();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error en suscripción de notificaciones:', error);
          this.error = 'Error al cargar notificaciones';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      })
    );

    this.subscription.add(
      this.notificationService.unreadCount$.subscribe({
        next: (count: number) => {
          console.log('📊 Contador actualizado:', count);
          this.unreadCount = count;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error en suscripción de contador:', error);
        }
      })
    );

    // ✅ Cargar notificaciones DESPUÉS de suscribirse
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * ✅ Cargar notificaciones con detección de cambios forzada
   */
  loadNotifications(): void {
    console.log('⏳ Iniciando carga de notificaciones...');
    this.isLoading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    this.notificationService.getAllNotifications(20).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta recibida en componente:', response);
        this.isLoading = false;
        
        if (response.success) {
          console.log('✅ Notificaciones cargadas exitosamente:', response.total);
        } else {
          this.error = response.error || response.message || 'Error al cargar las notificaciones';
          console.warn('⚠️ Respuesta sin éxito:', this.error);
        }
        
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error al cargar notificaciones:', error);
        this.error = 'Error al cargar las notificaciones. Por favor, intenta de nuevo.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * ✅ Actualizar listas de notificaciones con detección de cambios
   */
  updateNotificationLists(): void {
    // ✅ Crear NUEVOS arrays para forzar detección de cambios
    this.unreadNotifications = [...this.notifications.filter(n => !n.is_read)];
    this.readNotifications = [...this.notifications.filter(n => n.is_read)];
    
    console.log('📊 Listas actualizadas:', {
      total: this.notifications.length,
      unread: this.unreadNotifications.length,
      read: this.readNotifications.length,
      tab: this.activeTabId
    });
    
    // ✅ Forzar detección de cambios
    this.cdr.detectChanges();
  }

  /**
   * Cambiar tab activo y actualizar listas
   */
  setActiveTabId(tabId: NotificationsTabsType): void {
    console.log('🔄 Cambiando a tab:', tabId);
    this.activeTabId = tabId;
    // ✅ Actualizar listas al cambiar de tab
    this.updateNotificationLists();
  }

  /**
   * ✅ Marcar notificación como leída con detección de cambios
   */
  markAsRead(notification: Notification, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!notification.is_read) {
      console.log('📖 Marcando notificación como leída:', notification.id);
      
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('✅ Notificación marcada como leída exitosamente:', notification.id);
            // Las listas se actualizarán automáticamente vía la suscripción
            // Pero forzamos la detección por si acaso
            this.cdr.detectChanges();
          } else {
            console.error('⚠️ Respuesta sin éxito al marcar como leída:', response);
          }
        },
        error: (error: any) => {
          console.error('❌ Error al marcar notificación:', error);
          this.error = 'Error al marcar notificación como leída';
          this.cdr.detectChanges();
        }
      });
    } else {
      console.log('ℹ️ Notificación ya estaba marcada como leída:', notification.id);
    }
  }

  /**
   * ✅ Marcar todas como leídas con detección de cambios
   */
  markAllAsRead(): void {
    if (this.unreadCount === 0) {
      console.log('ℹ️ No hay notificaciones sin leer');
      return;
    }
    
    console.log('📖 Marcando todas las notificaciones como leídas...');
    
    this.notificationService.markAllAsRead().subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('✅ Todas las notificaciones marcadas como leídas exitosamente');
          // Las listas se actualizarán automáticamente vía la suscripción
          this.cdr.detectChanges();
        } else {
          console.error('⚠️ Respuesta sin éxito al marcar todas:', response);
        }
      },
      error: (error: any) => {
        console.error('❌ Error al marcar todas las notificaciones:', error);
        this.error = 'Error al marcar todas las notificaciones';
        this.cdr.detectChanges();
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
    console.log('🔄 Refrescando notificaciones manualmente...');
    this.loadNotifications();
  }

  /**
   * Método de depuración para ver el estado actual
   */
  debugState(): void {
    console.log('🔍 Estado actual del componente:', {
      isLoading: this.isLoading,
      error: this.error,
      totalNotifications: this.notifications.length,
      unreadNotifications: this.unreadNotifications.length,
      readNotifications: this.readNotifications.length,
      unreadCount: this.unreadCount,
      activeTab: this.activeTabId
    });
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

  getUserAvatar(): string {
    if (this.user?.avatar) {
      const avatar = this.user.avatar;

      // Si ya es un archivo tipo "3.png"
      if (/^\d+\.png$/.test(avatar)) {
        return `assets/media/avatars/${avatar}`;
      }

      // Si viene con URL completa (storage o externa)
      if (avatar.includes('http') || avatar.includes('storage')) {
        return avatar;
      }

      // Cualquier otro caso, construir ruta local
      return `assets/media/avatars/${avatar}`;
    }

    // Avatar por defecto
    return 'assets/media/avatars/blank.png';
  }

  getAvatar(path: string | null | undefined): string {
    if (!path) {
      return 'assets/media/avatars/blank.png';
    }

    // Si es como "3.png"
    if (/^\d+\.png$/.test(path)) {
      return `assets/media/avatars/${path}`;
    }

    // URL completa o storage
    if (path.includes('http') || path.includes('storage')) {
      return path;
    }

    // Caso general
    return `assets/media/avatars/${path}`;
  }


}