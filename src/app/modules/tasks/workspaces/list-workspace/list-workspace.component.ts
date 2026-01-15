import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';
import { GrupoService } from '../../grupos/service/grupo.service';
import { CreateWorkspaceComponent } from '../create-workspace/create-workspace.component';
import { EditWorkspaceComponent } from '../edit-workspace/edit-workspace.component';
import { DeleteWorkspaceComponent } from '../delete-workspace/delete-workspace.component';
import { CreateGrupoComponent } from '../../grupos/create-grupo/create-grupo.component';
import { EditGrupoComponent } from '../../grupos/edit-grupo/edit-grupo.component';
import { DeleteGrupoComponent } from '../../grupos/delete-grupo/delete-grupo.component';
import { ShareGrupoComponent } from '../../grupos/share-grupo/share-grupo.component';
import { PermisosGrupoModalComponent } from '../../grupos/permisos-grupo-modal/permisos-grupo-modal.component';

@Component({
  selector: 'app-list-workspace',
  templateUrl: './list-workspace.component.html',
  styleUrls: ['./list-workspace.component.scss']
})
export class ListWorkspaceComponent implements OnInit {
  
  search: string = '';
  WORKSPACES: any[] = [];
  isLoading$: any;
  
  openWorkspaceMenuId: number | null = null;
  openGrupoMenuId: number | null = null;

  constructor(
    private workspaceService: WorkspaceService,
    private grupoService: GrupoService,
    private modalService: NgbModal,
    private toast: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef  // ✅ Inyectar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.workspaceService.isLoading$;
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.workspaceService.listWorkspaces(this.search).subscribe({
      next: (resp: any) => {
        console.log('✅ Workspaces cargados:', resp);
        if (resp.message === 200) {
          this.WORKSPACES = resp.workspaces || [];
          
          this.WORKSPACES.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar workspaces:', error);
        this.toast.error('Error al cargar espacios de trabajo', 'Error');
      }
    });
  }

  createWorkspace() {
    const modalRef = this.modalService.open(CreateWorkspaceComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.WorkspaceC.subscribe((workspace: any) => {
      this.loadWorkspaces();
    });
  }

  editWorkspace(workspace: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(EditWorkspaceComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.WORKSPACE_SELECTED = workspace;
    modalRef.componentInstance.WorkspaceE.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeWorkspaceMenu();
  }

  deleteWorkspace(workspace: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(DeleteWorkspaceComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.WORKSPACE_SELECTED = workspace;
    modalRef.componentInstance.WorkspaceD.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeWorkspaceMenu();
  }

  goToWorkspaceGroups(workspaceId: number, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('📂 Navegando a workspace:', workspaceId);
    this.router.navigate(['/tasks/grupos', workspaceId]);
  }

  createGrupoInWorkspace(workspace: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(CreateGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.WORKSPACE_ID = workspace.id;
    modalRef.componentInstance.WORKSPACE_NAME = workspace.name;
    
    modalRef.componentInstance.GrupoC.subscribe((grupo: any) => {
      console.log('✅ Grupo creado:', grupo);
      this.loadWorkspaces();
      this.toast.success('Grupo agregado al workspace', 'Éxito');
    });
  }

  editGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(EditGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoE.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeGrupoMenu();
  }

  deleteGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(DeleteGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoD.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeGrupoMenu();
  }

  shareGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(ShareGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoShared.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeGrupoMenu();
  }

  configPermisosGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!grupo.is_owner) {
      this.toast.warning('Solo el creador del grupo puede gestionar permisos');
      return;
    }

    const modalRef = this.modalService.open(PermisosGrupoModalComponent, {
      centered: true,
      size: 'md'
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.PermisosChanged.subscribe(() => {
      this.loadWorkspaces();
    });
    
    this.closeGrupoMenu();
  }

  /**
   * ⭐ CORREGIDO: Marcar/Desmarcar grupo con detección de cambios INMEDIATA
   */
  toggleStarGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('⭐ Marcando grupo:', grupo.id, 'Estado actual:', grupo.is_starred);
    
    this.grupoService.toggleStar(grupo.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp);
        
        if (resp.message === 200) {
          // ✅ PASO 1: Actualizar el objeto local inmediatamente
          grupo.is_starred = resp.is_starred;
          
          // ✅ PASO 2: Buscar y actualizar en TODOS los workspaces
          this.WORKSPACES.forEach(workspace => {
            if (workspace.grupos && workspace.grupos.length > 0) {
              const grupoIndex = workspace.grupos.findIndex((g: any) => g.id === grupo.id);
              if (grupoIndex !== -1) {
                workspace.grupos[grupoIndex].is_starred = resp.is_starred;
              }
            }
          });
          
          // ✅ PASO 3: FORZAR detección de cambios ANTES de cerrar el menú
          this.cdr.detectChanges();
          
          // ✅ PASO 4: Mostrar mensaje de éxito
          const message = resp.is_starred ? 'Grupo marcado como favorito' : 'Grupo desmarcado';
          this.toast.success(message, 'Éxito');
          
          console.log('✅ Grupo actualizado y UI refrescada');
          
          // ✅ PASO 5: Cerrar menú DESPUÉS de actualizar la UI
          setTimeout(() => {
            this.closeGrupoMenu();
          }, 50);
        }
      },
      error: (error) => {
        console.error('❌ Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
        this.closeGrupoMenu();
      }
    });
  }

  /**
   * 🔗 Navegar al tablero pasando origen
   */
  goToTablero(grupoId: number, event?: MouseEvent) {
    if (event && (event.target as HTMLElement).closest('.grupo-options')) {
      return;
    }
    
    console.log('🔗 Navegando al tablero del grupo:', grupoId, 'desde list-workspace');
    this.router.navigate(['/tasks/tareas/tablero', grupoId], {
      queryParams: { from: 'list-workspace' }
    });
  }

  getWorkspaceColor(workspace: any): string {
    return workspace.color || '#6366f1';
  }

  /**
   * ✅ Toggle menú workspace
   */
  toggleWorkspaceMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openWorkspaceMenuId = this.openWorkspaceMenuId === id ? null : id;
    this.openGrupoMenuId = null;
    console.log('🔧 Menú workspace toggled:', this.openWorkspaceMenuId);
  }

  /**
   * ✅ Toggle menú grupo
   */
  toggleGrupoMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openGrupoMenuId = this.openGrupoMenuId === id ? null : id;
    this.openWorkspaceMenuId = null;
    console.log('🔧 Menú grupo toggled:', this.openGrupoMenuId);
  }

  closeWorkspaceMenu() {
    this.openWorkspaceMenuId = null;
  }

  closeGrupoMenu() {
    this.openGrupoMenuId = null;
  }

  /**
   * ✅ Cerrar menús al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    if (!target.closest('.workspace-options') && 
        !target.closest('.grupo-options') && 
        !target.closest('.menu')) {
      this.openWorkspaceMenuId = null;
      this.openGrupoMenuId = null;
    }
  }

  getAvatarUrl(avatar: string): string {
    if (!avatar) {
      return 'assets/media/avatars/blank.png';
    }
    
    if (avatar.match(/^\d+\.png$/)) {
      return `assets/media/avatars/${avatar}`;
    }
    
    if (avatar.includes('http') || avatar.includes('storage')) {
      return avatar;
    }
    
    return `assets/media/avatars/${avatar}`;
  }

  getGrupoImageUrl(imagen: string): string {
    if (!imagen) {
      return 'assets/media/fondos/fondo1.png';
    }
    
    if (!imagen.includes('/') && !imagen.includes('http')) {
      return `assets/media/fondos/${imagen}`;
    }
    
    return imagen;
  }
}