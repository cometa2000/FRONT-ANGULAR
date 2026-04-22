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
    this.subscription.add(
      this.notificationService.notifications$.subscribe({
        next: (notifications: Notification[]) => {
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
          this.unreadCount = count;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error en suscripción de contador:', error);
        }
      })
    );

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.notificationService.getAllNotifications(20).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (!response.success) {
          this.error = response.error || response.message || 'Error al cargar las notificaciones';
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

  updateNotificationLists(): void {
    this.unreadNotifications = [...this.notifications.filter(n => !n.is_read)];
    this.readNotifications   = [...this.notifications.filter(n => n.is_read)];
    this.cdr.detectChanges();
  }

  setActiveTabId(tabId: NotificationsTabsType): void {
    this.activeTabId = tabId;
    this.updateNotificationLists();
  }

  markAsRead(notification: Notification, event?: Event): void {
    if (event) event.stopPropagation();

    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (response: any) => {
          if (!response.success) {
            console.error('⚠️ Respuesta sin éxito al marcar como leída:', response);
          }
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error al marcar notificación:', error);
          this.error = 'Error al marcar notificación como leída';
          this.cdr.detectChanges();
        }
      });
    }
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().subscribe({
      next: (response: any) => {
        if (!response.success) {
          console.error('⚠️ Respuesta sin éxito al marcar todas:', response);
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error al marcar todas las notificaciones:', error);
        this.error = 'Error al marcar todas las notificaciones';
        this.cdr.detectChanges();
      }
    });
  }

  deleteNotification(notificationId: number, event: Event): void {
    event.stopPropagation();

    if (confirm('¿Estás seguro de eliminar esta notificación?')) {
      this.notificationService.deleteNotification(notificationId).subscribe({
        next: (response: any) => {
          if (response.success) this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error al eliminar notificación:', error);
        }
      });
    }
  }

  deleteAllRead(): void {
    if (this.readNotifications.length === 0) return;

    if (confirm('¿Estás seguro de eliminar todas las notificaciones leídas?')) {
      this.notificationService.deleteAllRead().subscribe({
        next: (response: any) => {
          if (response.success) this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error al eliminar notificaciones:', error);
        }
      });
    }
  }

  refresh(): void {
    this.loadNotifications();
  }

  // ===========================================================================
  // REDIRECCIÓN SEGÚN TIPO DE NOTIFICACIÓN
  // ===========================================================================

  /**
   * Determina la ruta de destino y navega al hacer clic en una notificación.
   *
   * Lógica de redirección:
   *   - Notificaciones de tarea/checklist/reactivación → tablero del grupo
   *       /tasks/tareas/tablero/:grupoId
   *   - Notificaciones de grupo (creado/compartido) → lista de grupos del workspace
   *       /tasks/grupos/:workspaceId
   *   - Notificaciones de workspace → lista de workspaces
   *       /tasks/workspaces/list
   *
   * El campo `data` del objeto notificación (JSON almacenado en DB) contiene
   * grupo_id y workspace_id para construir la URL sin consultas adicionales.
   * Como fallback se usan los campos directos tarea.id, grupo.id de la notif.
   */
  goToNotification(notification: Notification, event?: Event): void {
    if (event) event.stopPropagation();

    // Marcar como leída si aplica
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    const type = notification.type;
    const data = notification.data || {};

    // ── 1. Tipos que redirigen al TABLERO DE TAREAS ──────────────────────────
    const tiposTarea = [
      'task_assigned',
      'task_completed',
      'task_overdue',
      'task_due_soon',
      'checklist_item_assigned',
      'checklist_item_assigned_owner',
      'checklist_item_due',
      'reactivacion_solicitante',
      'reactivacion_propietario',
      'tarea_reactivada',
      'reactivacion_confirmada',
    ];

    if (tiposTarea.includes(type)) {
      // Prioridad: data.grupo_id → notification.grupo?.id → notification.tarea?.id (fallback)
      const grupoId = data['grupo_id'] ?? notification.grupo?.id ?? null;

      if (grupoId) {
        this.router.navigate(['/tasks/tareas/tablero', grupoId]);
      } else {
        // No hay grupo disponible, ir a la lista general de tareas
        this.router.navigate(['/tasks/tareas/list']);
      }
      return;
    }

    // ── 2. Tipos que redirigen a GRUPOS DEL WORKSPACE ────────────────────────
    const tiposGrupo = [
      'group_created',
      'group_shared_invited',
      'group_shared_owner',
    ];

    if (tiposGrupo.includes(type)) {
      // Prioridad: data.workspace_id → ruta de grupos del workspace
      const workspaceId = data['workspace_id'] ?? null;

      if (workspaceId) {
        this.router.navigate(['/tasks/grupos', workspaceId]);
      } else {
        // Si el grupo no tiene workspace (grupos sin workspace_id en BD),
        // navegar a la lista de workspaces como fallback
        this.router.navigate(['/tasks/workspaces/list']);
      }
      return;
    }

    // ── 3. Tipos que redirigen a WORKSPACES ──────────────────────────────────
    if (type === 'workspace_created') {
      this.router.navigate(['/tasks/workspaces/list']);
      return;
    }

    // ── 4. Tipo desconocido: no navegar ──────────────────────────────────────
    console.warn('⚠️ Tipo de notificación sin ruta definida:', type);
  }

  // ===========================================================================
  // UTILIDADES DE VISTA
  // ===========================================================================

  getIconClass(notification: Notification): string {
    return `bg-light-${notification.color}`;
  }

  getBadgeClass(notification: Notification): string {
    return notification.is_read ? 'badge-light' : `badge-light-${notification.color}`;
  }

  getUserAvatar(): string {
    if (this.user?.avatar) {
      const avatar = this.user.avatar;
      if (/^\d+\.png$/.test(avatar)) return `assets/media/avatars/${avatar}`;
      if (avatar.includes('http') || avatar.includes('storage')) return avatar;
      return `assets/media/avatars/${avatar}`;
    }
    return 'assets/media/avatars/1.png';
  }

  getAvatar(path: string | null | undefined): string {
    if (!path) return 'assets/media/avatars/1.png';
    if (/^\d+\.png$/.test(path)) return `assets/media/avatars/${path}`;
    if (path.includes('http') || path.includes('storage')) return path;
    return `assets/media/avatars/${path}`;
  }
}