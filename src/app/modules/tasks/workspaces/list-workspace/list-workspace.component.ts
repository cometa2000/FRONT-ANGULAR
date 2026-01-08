// ✅ FIX ERROR 2: Agregar HostListener en los imports
import { Component, OnInit, HostListener } from '@angular/core';
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
  
  // Control de menús desplegables
  openWorkspaceMenuId: number | null = null;
  openGrupoMenuId: number | null = null;

  constructor(
    private workspaceService: WorkspaceService,
    private grupoService: GrupoService,
    private modalService: NgbModal,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.workspaceService.isLoading$;
    this.loadWorkspaces();
  }

  /**
   * 📋 Cargar todos los workspaces con sus grupos
   */
  loadWorkspaces() {
    this.workspaceService.listWorkspaces(this.search).subscribe({
      next: (resp: any) => {
        console.log('✅ Workspaces cargados:', resp);
        if (resp.message === 200) {
          this.WORKSPACES = resp.workspaces || [];
          
          // Ordenar por fecha de creación (más recientes primero)
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

  /**
   * ➕ Crear nuevo workspace
   */
  createWorkspace() {
    const modalRef = this.modalService.open(CreateWorkspaceComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.WorkspaceC.subscribe((workspace: any) => {
      this.loadWorkspaces();
    });
  }

  /**
   * ✏️ Editar workspace
   */
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

  /**
   * 🗑️ Eliminar workspace
   */
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

  /**
   * ✅ Navegar a la vista de grupos de un workspace
   */
  goToWorkspaceGroups(workspaceId: number, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('📂 Navegando a workspace:', workspaceId);
    this.router.navigate(['/tasks/grupos', workspaceId]);
  }

  /**
   * ➕ Crear grupo en un workspace específico
   */
  createGrupoInWorkspace(workspace: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(CreateGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    // Pasar el workspace_id al modal
    modalRef.componentInstance.WORKSPACE_ID = workspace.id;
    modalRef.componentInstance.WORKSPACE_NAME = workspace.name;
    
    modalRef.componentInstance.GrupoC.subscribe((grupo: any) => {
      console.log('✅ Grupo creado:', grupo);
      this.loadWorkspaces();
      this.toast.success('Grupo agregado al workspace', 'Éxito');
    });
  }

  /**
   * ✏️ Editar grupo
   */
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

  /**
   * 🗑️ Eliminar grupo
   */
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

  /**
   * 📤 Compartir grupo
   */
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

  /**
   * ⚙️ Configurar permisos del grupo
   */
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
   * ⭐ Marcar/Desmarcar grupo como favorito
   */
  toggleStarGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.grupoService.toggleStar(grupo.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          grupo.is_starred = resp.is_starred;
          const message = grupo.is_starred ? 'Grupo marcado' : 'Marca removida';
          this.toast.success(message, 'Éxito');
          this.loadWorkspaces();
        }
      },
      error: (error) => {
        console.error('Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
    
    this.closeGrupoMenu();
  }

  /**
   * 🔗 Navegar al tablero de tareas del grupo
   * ✅ SOLUCIÓN PROBLEMA 4: Pasar origen list-workspace
   */
  goToTablero(grupoId: number) {
    console.log('🔗 Navegando al tablero del grupo:', grupoId, 'desde list-workspace');
    // ✅ Pasar queryParams indicando que viene de list-workspace
    this.router.navigate(['/tasks/tareas/tablero', grupoId], {
      queryParams: { from: 'list-workspace' }
    });
  }

  /**
   * 🎨 Obtener color de fondo para el workspace
   */
  getWorkspaceColor(workspace: any): string {
    return workspace.color || '#6366f1';
  }

  /**
   * 🔧 Toggle menú workspace
   * ✅ SOLUCIÓN PROBLEMA 1: Con posicionamiento dinámico
   */
  toggleWorkspaceMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openWorkspaceMenuId = this.openWorkspaceMenuId === id ? null : id;
    this.openGrupoMenuId = null;
    
    // ✅ Posicionar menú
    if (this.openWorkspaceMenuId === id) {
      setTimeout(() => this.positionMenu(event), 0);
    }
  }

  /**
   * 🔧 Toggle menú grupo
   * ✅ SOLUCIÓN PROBLEMA 1: Con posicionamiento dinámico
   */
  toggleGrupoMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openGrupoMenuId = this.openGrupoMenuId === id ? null : id;
    this.openWorkspaceMenuId = null;
    
    // ✅ Posicionar menú
    if (this.openGrupoMenuId === id) {
      setTimeout(() => this.positionMenu(event), 0);
    }
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 1: Posicionar menú dinámicamente
   */
  private positionMenu(event: MouseEvent) {
    const button = event.target as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    
    // Buscar el menú en workspace o grupo
    let menu = button.parentElement?.querySelector('.menu.show') as HTMLElement;
    
    if (!menu) {
      // Intentar buscar en grupo-options
      menu = button.closest('.grupo-options')?.querySelector('.menu.show') as HTMLElement;
    }
    
    if (menu) {
      menu.style.top = `${buttonRect.bottom + 5}px`;
      menu.style.left = `${buttonRect.right - 200}px`;
    }
  }

  /**
   * 🚫 Cerrar menús
   */
  closeWorkspaceMenu() {
    this.openWorkspaceMenuId = null;
  }

  closeGrupoMenu() {
    this.openGrupoMenuId = null;
  }

  /**
   * 🚫 Cerrar menús al hacer clic fuera
   * ✅ FIX ERROR 2: HostListener ahora está correctamente importado
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.openWorkspaceMenuId = null;
    this.openGrupoMenuId = null;
  }

  /**
   * 🎨 Obtener avatar del usuario
   */
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

  /**
   * 🎨 Obtener URL de imagen de grupo
   */
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