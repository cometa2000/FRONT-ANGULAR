import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Subject, takeUntil, timer, retry, catchError, of } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { WorkspaceService } from 'src/app/modules/tasks/workspaces/service/workspace.service';
import { TicketsService, TicketMetricas } from 'src/app/modules/sistema-de-tickets/tickets/service/tickets.service';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit, OnDestroy {

  user: any;
  workspaces: any[] = [];
  loadingWorkspaces: boolean = false;
  private destroy$ = new Subject<void>();
  private loadAttempts = 0;
  private maxRetries = 3;

  // Métricas de tickets para los badges del sidebar
  ticketMetricas: TicketMetricas | null = null;

  constructor(
    public authService: AuthService,
    private workspaceService: WorkspaceService,
    private ticketsService: TicketsService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) { }

  ngOnInit(): void {
    this.user = this.authService.user;

    timer(200).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadWorkspaces();
    });

    this.workspaceService.workspacesChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(changed => {
      if (changed) {
        this.loadWorkspaces();
      }
    });

    // ================================================================
    // MÉTRICAS REACTIVAS
    // Nos suscribimos al BehaviorSubject del servicio.
    // Cada vez que ListTicketsComponent actualiza las métricas
    // (por polling o por acción del usuario), los badges del sidebar
    // se actualizan automáticamente sin recargar la página.
    // ================================================================
    if (this.showMenu(['register_ticket', 'edit_ticket'])) {
      // 1. Carga inicial desde la API
      this.loadTicketMetricas();

      // 2. Suscripción reactiva al stream compartido de métricas
      this.ticketsService.metricas$
        .pipe(takeUntil(this.destroy$))
        .subscribe((metricas: TicketMetricas | null) => {
          if (metricas) {
            this.ngZone.run(() => {
              this.ticketMetricas = metricas;
              this.cdr.detectChanges();
            });
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================================================================
  // MÉTRICAS DE TICKETS — carga inicial
  // ================================================================

  /**
   * Carga inicial de métricas desde la API.
   * Las actualizaciones posteriores llegan a través de metricas$
   * (stream reactivo del servicio), sin necesidad de polling propio
   * en el sidebar.
   */
  loadTicketMetricas(): void {
    this.ticketsService.getMetricas().pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe((resp: any) => {
      if (resp?.metricas) {
        this.ngZone.run(() => {
          this.ticketMetricas = resp.metricas;
          // Sincronizar con el BehaviorSubject por si el sidebar
          // se carga antes que el componente de lista
          this.ticketsService.metricasSubject.next(resp.metricas);
          this.cdr.detectChanges();
        });
      }
    });
  }

  /** Devuelve el conteo de la vista indicada, 0 si no hay datos */
  getTicketBadge(vista: string): number {
    if (!this.ticketMetricas) return 0;
    const map: Record<string, number> = {
      bandeja:     this.ticketMetricas.bandeja     ?? 0,
      enviados:    this.ticketMetricas.enviados    ?? 0,
      en_proceso:  this.ticketMetricas.en_proceso  ?? 0,
      finalizados: this.ticketMetricas.finalizados ?? 0,
      archivados:  this.ticketMetricas.archivados  ?? 0,
      favoritos:   this.ticketMetricas.favoritos   ?? 0,
    };
    return map[vista] ?? 0;
  }

  // ================================================================
  // WORKSPACES
  // ================================================================

  loadWorkspaces() {
    if (!this.showMenu(['register_task', 'edit_task'])) return;

    this.loadingWorkspaces = true;
    this.loadAttempts++;

    this.workspaceService.listWorkspaces().pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(() => of({ message: 500, workspaces: [] })),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        if (resp.message === 200 && resp.workspaces) {
          this.ngZone.run(() => {
            this.workspaces = (resp.workspaces || []).sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            this.loadingWorkspaces = false;
            this.loadAttempts = 0;
            this.cdr.detectChanges();
          });
        } else if (this.loadAttempts < this.maxRetries) {
          timer(2000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.loadingWorkspaces = false;
            this.loadWorkspaces();
          });
        } else {
          this.loadingWorkspaces = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.ngZone.run(() => {
          this.loadingWorkspaces = false;
          this.cdr.detectChanges();
        });
        if (this.loadAttempts < this.maxRetries) {
          timer(2000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadWorkspaces());
        }
      }
    });
  }

  reloadWorkspaces() {
    this.workspaces = [];
    this.loadAttempts = 0;
    this.loadWorkspaces();
  }

  showMenu(permisos: any = []) {
    if (this.isRole()) return true;
    let permissions = this.user?.permissions || [];
    return permisos.some((p: any) => permissions.includes(p));
  }

  isRole() {
    return this.user?.role_name == 'Super-Admin';
  }
}