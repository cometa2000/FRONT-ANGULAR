import { Component, HostListener, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { WorkspaceService } from '../../workspaces/service/workspace.service';
import { CreateGrupoComponent } from '../create-grupo/create-grupo.component';
import { EditGrupoComponent } from '../edit-grupo/edit-grupo.component';
import { DeleteGrupoComponent } from '../delete-grupo/delete-grupo.component';
import { ShareGrupoComponent } from '../share-grupo/share-grupo.component';
import { ToastrService } from 'ngx-toastr';
import { PermisosGrupoModalComponent } from '../permisos-grupo-modal/permisos-grupo-modal.component';
import { AuthService } from 'src/app/modules/auth';
import { Subject, takeUntil, filter } from 'rxjs';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-grupo',
  templateUrl: './list-grupo.component.html',
  styleUrls: ['./list-grupo.component.scss']
})
export class ListGrupoComponent implements OnInit, OnDestroy {
  search: string = '';
  GRUPOS: any = [];
  isLoading$: any;

  // ✅ SOLUCIÓN PROBLEMA 2: Paginación
  totalPages: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 12; // ✅ 12 grupos por página
  totalItems: number = 0;
  paginatedGrupos: any[] = [];

  // ✅ FIX ERROR 1: Exponer Math para usar en template
  Math = Math;

  openMenuId: number | null = null;
  
  activeTooltip: number | null = null;
  showAllUsers: { [key: number]: boolean } = {};

  selectedGrupo: any = null;
  miembrosGrupo: any[] = [];
  loadingMiembros: boolean = false;

  currentUser: any = null;
  user: any = null;

  workspaceId!: number;
  workspace: any = null;
  loadingWorkspace: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    public modalService: NgbModal,
    public grupoService: GrupoService,
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.grupoService.isLoading$;
    
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const newWorkspaceId = +params['workspaceId'];
      
      console.log('🔍 List-Grupo: Params detectados, workspaceId:', newWorkspaceId);
      
      if (newWorkspaceId && newWorkspaceId !== this.workspaceId) {
        this.workspaceId = newWorkspaceId;
        console.log('📌 List-Grupo: Workspace ID actualizado:', this.workspaceId);
        
        this.loadWorkspaceInfo();
        this.listGruposByWorkspace();
      } else if (newWorkspaceId) {
        this.workspaceId = newWorkspaceId;
        console.log('🔄 List-Grupo: Mismo workspace, recargando...');
        this.loadWorkspaceInfo();
        this.listGruposByWorkspace();
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      console.log('🔀 List-Grupo: Navegación detectada:', event.url);
      
      const match = event.url.match(/\/tasks\/grupos\/(\d+)/);
      if (match) {
        const workspaceIdFromUrl = +match[1];
        console.log('📍 List-Grupo: Workspace ID desde URL:', workspaceIdFromUrl);
        
        if (workspaceIdFromUrl && workspaceIdFromUrl !== this.workspaceId) {
          this.workspaceId = workspaceIdFromUrl;
          console.log('♻️ List-Grupo: Cargando nuevo workspace');
          this.loadWorkspaceInfo();
          this.listGruposByWorkspace();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkspaceInfo() {
    this.loadingWorkspace = true;
    console.log('📂 List-Grupo: Cargando info workspace:', this.workspaceId);
    
    this.workspaceService.getWorkspace(this.workspaceId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        console.log('✅ List-Grupo: Workspace cargado:', resp);
        if (resp.message === 200) {
          this.workspace = resp.workspace;
          console.log('📋 Workspace:', this.workspace.name);
        }
        this.loadingWorkspace = false;
      },
      error: (error) => {
        console.error('❌ List-Grupo: Error al cargar workspace:', error);
        this.toast.error('Error al cargar el espacio de trabajo', 'Error');
        this.loadingWorkspace = false;
      }
    });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 2: Listar grupos con paginación
   */
  listGruposByWorkspace() {
    console.log('📋 List-Grupo: Cargando grupos del workspace:', this.workspaceId);
    
    this.workspaceService.getWorkspaceGroups(this.workspaceId, this.search).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        console.log('✅ List-Grupo: Grupos recibidos:', resp);
        if (resp.message === 200) {
          this.GRUPOS = resp.grupos || [];
          this.totalItems = this.GRUPOS.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          
          console.log(`📊 Total grupos: ${this.GRUPOS.length}`);
          console.log(`📄 Total páginas: ${this.totalPages}`);
          
          // ✅ Aplicar paginación
          this.updatePaginatedGrupos();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ List-Grupo: Error al cargar grupos:', error);
        this.toast.error('Error al cargar los grupos', 'Error');
      }
    });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 2: Actualizar grupos paginados
   */
  updatePaginatedGrupos() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedGrupos = this.GRUPOS.slice(startIndex, endIndex);
    
    console.log(`📄 Página ${this.currentPage}: Mostrando grupos ${startIndex + 1}-${Math.min(endIndex, this.totalItems)} de ${this.totalItems}`);
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 2: Cambiar página
   */
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    this.updatePaginatedGrupos();
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 2: Obtener array de páginas
   */
  getPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  loadPage($event: any) {
    this.goToPage($event);
  }

  createGrupo() {
    const modalRef = this.modalService.open(CreateGrupoComponent, { centered: true, size: 'md' });
    
    modalRef.componentInstance.WORKSPACE_ID = this.workspaceId;
    modalRef.componentInstance.WORKSPACE_NAME = this.workspace?.name;
    
    modalRef.componentInstance.GrupoC.subscribe((grupo: any) => {
      this.GRUPOS.unshift(grupo);
      this.totalItems = this.GRUPOS.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      this.updatePaginatedGrupos();
    });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 3: Detener propagación en todas las acciones
   */
  editGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(EditGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoE.subscribe((grupoEditado: any) => {
      const index = this.GRUPOS.findIndex((g: any) => g.id === grupo.id);
      if (index !== -1) {
        this.GRUPOS[index] = grupoEditado;
        this.updatePaginatedGrupos();
      }
    });
  }

  deleteGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(DeleteGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoD.subscribe(() => {
      this.GRUPOS = this.GRUPOS.filter((g: any) => g.id !== grupo.id);
      this.totalItems = this.GRUPOS.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      
      if (this.paginatedGrupos.length === 0 && this.currentPage > 1) {
        this.currentPage--;
      }
      
      this.updatePaginatedGrupos();
    });
  }

  shareGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(ShareGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoShared.subscribe(() => {
      this.listGruposByWorkspace();
    });
  }

  marcarGrupo(grupo: any, event?: MouseEvent) {
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
          
          this.GRUPOS.sort((a: any, b: any) => {
            if (a.is_starred === b.is_starred) return 0;
            return a.is_starred ? -1 : 1;
          });
          this.updatePaginatedGrupos();
        }
      },
      error: (error) => {
        console.error('Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMAS 3 y 4: Navegar al tablero pasando origen
   */
  goToTablero(grupoId: number, event?: MouseEvent) {
    if (event && (event.target as HTMLElement).closest('.grupo-options-modern')) {
      return;
    }
    
    console.log('🔗 Navegando al tablero del grupo:', grupoId, 'desde list-grupo');
    // ✅ SOLUCIÓN PROBLEMA 4: Pasar queryParams con el origen
    this.router.navigate(['/tasks/tareas/tablero', grupoId], {
      queryParams: { from: 'list-grupo', workspaceId: this.workspaceId }
    });
  }

  configPermisos(grupo: any, event?: MouseEvent) {
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
      this.listGruposByWorkspace();
    });
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 1: Toggle menú con posicionamiento dinámico
   */
  toggleMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    this.openMenuId = this.openMenuId === id ? null : id;

    if (this.openMenuId === id) {
      setTimeout(() => this.positionMenu(event), 0);
    }
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 1: Posicionar menú dinámicamente con position: fixed
   */
  private positionMenu(event: MouseEvent) {
    const button = event.target as HTMLElement;
    const buttonRect = button.getBoundingClientRect();
    const menu = button.closest('.grupo-options-modern')?.querySelector('.menu.show') as HTMLElement;
    
    if (menu) {
      menu.style.top = `${buttonRect.bottom + 5}px`;
      menu.style.left = `${buttonRect.right - 200}px`;
    }
  }

  closeMenu() {
    this.openMenuId = null;
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnClickOutside() {
    this.openMenuId = null;
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 3: Pasar evento a todas las acciones
   */
  closeMenuAnd(action: string, grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.closeMenu();
    
    setTimeout(() => {
      switch (action) {
        case 'marcarGrupo':
          this.marcarGrupo(grupo, event);
          break;
        case 'shareGrupo':
          this.shareGrupo(grupo, event);
          break;
        case 'configPermisos':
          this.configPermisos(grupo, event);
          break;
        case 'editGrupo':
          this.editGrupo(grupo, event);
          break;
        case 'deleteGrupo':
          this.deleteGrupo(grupo, event);
          break;
      }
    }, 100);
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

  openMiembrosModal() {}

  closeMiembrosModal() {
    this.selectedGrupo = null;
    this.miembrosGrupo = [];
  }

  verMiembros(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.selectedGrupo = { ...grupo };
    this.miembrosGrupo = [];
    this.loadingMiembros = true;
    this.openMiembrosModal();
    
    this.grupoService.getSharedUsers(grupo.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.miembrosGrupo = resp.shared_users || [];
          this.selectedGrupo.shared_with = resp.shared_users || [];
        }
        this.loadingMiembros = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar miembros:', error);
        this.loadingMiembros = false;
        this.cdr.detectChanges();
        this.toast.error('No se pudieron cargar los miembros del grupo', 'Error');
        this.closeMiembrosModal();
      }
    });
  }

  showTooltip(grupoId: number) {
    this.activeTooltip = grupoId;
  }

  hideTooltip() {
    this.activeTooltip = null;
  }

  toggleShowAllUsers(grupoId: number) {
    this.showAllUsers[grupoId] = !this.showAllUsers[grupoId];
  }
}