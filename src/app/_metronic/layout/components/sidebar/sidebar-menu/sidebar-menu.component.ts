import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, timer, retry, catchError, of } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { WorkspaceService } from 'src/app/modules/tasks/workspaces/service/workspace.service';

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
  
  constructor(
    public authService: AuthService,
    private workspaceService: WorkspaceService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.user;
    
    // ✅ SOLUCIÓN PROBLEMA 1: Timer inicial más corto
    timer(200).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadWorkspaces();
    });

    // ✅ SOLUCIÓN PROBLEMAS 1 y 2: Suscribirse a cambios de workspaces
    this.workspaceService.workspacesChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(changed => {
      if (changed) {
        console.log('🔔 Sidebar: Detectado cambio en workspaces, recargando...');
        this.loadWorkspaces();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * 📋 Cargar workspaces del usuario
   * ✅ SOLUCIÓN PROBLEMA 1: Mejor manejo de datos
   */
  loadWorkspaces() {
    if (!this.showMenu(['register_task', 'edit_task'])) {
      return;
    }
    
    this.loadingWorkspaces = true;
    this.loadAttempts++;
    
    console.log(`🔄 Sidebar - Intento ${this.loadAttempts} de cargar workspaces...`);
    
    this.workspaceService.listWorkspaces().pipe(
      retry({
        count: 2,
        delay: 1000
      }),
      catchError(error => {
        console.error('❌ Sidebar - Error al cargar workspaces:', error);
        return of({ message: 500, workspaces: [] });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        console.log('📦 Sidebar - Respuesta recibida:', resp);
        
        if (resp.message === 200 && resp.workspaces) {
          this.workspaces = resp.workspaces || [];
          
          // Ordenar por fecha de creación (más recientes primero)
          this.workspaces.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          console.log('✅ Sidebar - Workspaces cargados:', this.workspaces.length);
          console.log('📋 Workspaces:', this.workspaces.map(w => w.name));
          
          this.loadingWorkspaces = false;
          this.loadAttempts = 0; // Reset intentos después de éxito
          
        } else if (this.loadAttempts < this.maxRetries) {
          // Reintentar después de 2 segundos
          console.log('🔄 Sidebar - Reintentando en 2 segundos...');
          timer(2000).pipe(
            takeUntil(this.destroy$)
          ).subscribe(() => {
            this.loadingWorkspaces = false;
            this.loadWorkspaces();
          });
        } else {
          console.warn('⚠️ Sidebar - Máximo de reintentos alcanzado');
          this.loadingWorkspaces = false;
        }
      },
      error: (error) => {
        console.error('❌ Sidebar - Error en suscripción:', error);
        this.loadingWorkspaces = false;
        
        // ✅ Reintentar automáticamente si no se ha alcanzado el máximo
        if (this.loadAttempts < this.maxRetries) {
          timer(2000).pipe(
            takeUntil(this.destroy$)
          ).subscribe(() => {
            this.loadWorkspaces();
          });
        }
      }
    });
  }
  
  /**
   * 🔄 Método público para recargar workspaces
   */
  reloadWorkspaces() {
    console.log('🔄 Sidebar - Recarga manual solicitada');
    this.workspaces = [];
    this.loadAttempts = 0;
    this.loadWorkspaces();
  }
  
  showMenu(permisos: any = []) {
    if (this.isRole()) {
      return true;
    }
    let permissions = this.user?.permissions || [];
    var is_show = false;
    permisos.forEach((permiso: any) => {
      if (permissions.includes(permiso)) {
        is_show = true;
      }
    });
    return is_show;
  }

  isRole() {
    return this.user?.role_name == 'Super-Admin' ? true : false;
  }
}