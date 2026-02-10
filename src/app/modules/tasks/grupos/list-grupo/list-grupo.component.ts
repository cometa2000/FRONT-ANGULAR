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

  // Paginación
  totalPages: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalItems: number = 0;
  paginatedGrupos: any[] = [];

  // ✅ FIX: Exponer Math para template
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
      
      if (newWorkspaceId && newWorkspaceId !== this.workspaceId) {
        this.workspaceId = newWorkspaceId;
        this.loadWorkspaceInfo();
        this.listGruposByWorkspace();
      } else if (newWorkspaceId) {
        this.workspaceId = newWorkspaceId;
        this.loadWorkspaceInfo();
        this.listGruposByWorkspace();
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      const match = event.url.match(/\/tasks\/grupos\/(\d+)/);
      if (match) {
        const workspaceIdFromUrl = +match[1];
        if (workspaceIdFromUrl && workspaceIdFromUrl !== this.workspaceId) {
          this.workspaceId = workspaceIdFromUrl;
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
    
    this.workspaceService.getWorkspace(this.workspaceId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.workspace = resp.workspace;
        }
        this.loadingWorkspace = false;
      },
      error: (error) => {
        console.error('Error al cargar workspace:', error);
        this.toast.error('Error al cargar el espacio de trabajo', 'Error');
        this.loadingWorkspace = false;
      }
    });
  }

  listGruposByWorkspace() {
    console.log('🔄 Cargando grupos del workspace:', this.workspaceId);
    
    this.workspaceService.getWorkspaceGroups(this.workspaceId, this.search).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        console.log('📦 Respuesta del servidor:', resp);
        
        if (resp.message === 200) {
          this.GRUPOS = resp.grupos || [];
          
          // 🐛 DEBUG: Mostrar estado de is_starred de cada grupo
          console.log('📊 Estado de grupos cargados:');
          this.GRUPOS.forEach((grupo: any) => {
            console.log(`  - Grupo "${grupo.name}" (ID: ${grupo.id}):`, {
              is_starred: grupo.is_starred,
              tipo: typeof grupo.is_starred,
              valor_raw: JSON.stringify(grupo.is_starred)
            });
          });
          
          this.totalItems = this.GRUPOS.length;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.updatePaginatedGrupos();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar grupos:', error);
        this.toast.error('Error al cargar los grupos', 'Error');
      }
    });
  }

  updatePaginatedGrupos() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedGrupos = this.GRUPOS.slice(startIndex, endIndex);
    
    console.log('📄 Grupos paginados actualizados:', this.paginatedGrupos.length);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedGrupos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  /**
   * ⭐ CORREGIDO Y MEJORADO: Marcar/Desmarcar grupo con debugging completo
   */
  marcarGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('==========================================');
    console.log('⭐ MARCANDO GRUPO - INICIO');
    console.log('==========================================');
    console.log('📋 Grupo seleccionado:', {
      id: grupo.id,
      nombre: grupo.name,
      is_starred_antes: grupo.is_starred,
      tipo_is_starred: typeof grupo.is_starred
    });
    
    this.grupoService.toggleStar(grupo.id).subscribe({
      next: (resp: any) => {
        console.log('📥 Respuesta completa del servidor:', resp);
        console.log('📊 Datos de la respuesta:', {
          message: resp.message,
          is_starred: resp.is_starred,
          tipo_is_starred: typeof resp.is_starred,
          todas_las_propiedades: Object.keys(resp)
        });
        
        if (resp.message === 200 || resp.message === '200') {
          
          // ✅ Obtener el nuevo valor de is_starred del servidor
          const nuevoEstado = resp.is_starred === true || resp.is_starred === 'true' || resp.is_starred === 1;
          
          console.log('🔄 Actualizando estado:', {
            estado_del_servidor: resp.is_starred,
            estado_convertido: nuevoEstado,
            tipo_convertido: typeof nuevoEstado
          });
          
          // ✅ ACTUALIZACIÓN 1: Objeto local directo
          grupo.is_starred = nuevoEstado;
          console.log('✅ Grupo local actualizado:', grupo.is_starred);
          
          // ✅ ACTUALIZACIÓN 2: Array principal GRUPOS
          const grupoIndexMain = this.GRUPOS.findIndex((g: any) => g.id === grupo.id);
          if (grupoIndexMain !== -1) {
            this.GRUPOS[grupoIndexMain].is_starred = nuevoEstado;
            console.log('✅ Array GRUPOS actualizado en índice:', grupoIndexMain);
            console.log('   Estado del grupo en GRUPOS:', this.GRUPOS[grupoIndexMain].is_starred);
          } else {
            console.warn('⚠️ No se encontró el grupo en GRUPOS');
          }
          
          // ✅ ACTUALIZACIÓN 3: Array paginado
          const paginatedIndex = this.paginatedGrupos.findIndex((g: any) => g.id === grupo.id);
          if (paginatedIndex !== -1) {
            this.paginatedGrupos[paginatedIndex].is_starred = nuevoEstado;
            console.log('✅ Array paginatedGrupos actualizado en índice:', paginatedIndex);
            console.log('   Estado del grupo en paginatedGrupos:', this.paginatedGrupos[paginatedIndex].is_starred);
          } else {
            console.warn('⚠️ No se encontró el grupo en paginatedGrupos');
          }
          
          // ✅ Mensaje de éxito
          const mensaje = nuevoEstado ? '⭐ Grupo marcado como favorito' : '☆ Grupo desmarcado';
          this.toast.success(mensaje, 'Éxito');
          
          // ✅ ORDENAR: Mover favoritos al inicio
          console.log('🔀 Ordenando grupos (favoritos primero)...');
          this.GRUPOS.sort((a: any, b: any) => {
            if (a.is_starred === b.is_starred) return 0;
            return a.is_starred ? -1 : 1;
          });
          
          // ✅ Actualizar vista paginada
          this.updatePaginatedGrupos();
          
          // ✅ Forzar detección de cambios
          this.cdr.detectChanges();
          
          console.log('✅ PROCESO COMPLETADO');
          console.log('📊 Estado final de todos los grupos:');
          this.GRUPOS.forEach((g: any, index: number) => {
            console.log(`   ${index + 1}. ${g.name}: is_starred = ${g.is_starred} (${typeof g.is_starred})`);
          });
          
          // 🐛 VERIFICACIÓN FINAL
          setTimeout(() => {
            console.log('🔍 VERIFICACIÓN POST-ACTUALIZACIÓN (después de 100ms):');
            const grupoVerificacion = this.GRUPOS.find((g: any) => g.id === grupo.id);
            console.log('   Grupo en GRUPOS:', grupoVerificacion?.is_starred);
            const grupoVerificacionPag = this.paginatedGrupos.find((g: any) => g.id === grupo.id);
            console.log('   Grupo en paginatedGrupos:', grupoVerificacionPag?.is_starred);
            console.log('   Grupo local:', grupo.is_starred);
          }, 100);
          
        } else {
          console.error('❌ Código de respuesta inesperado:', resp.message);
          this.toast.error('Error al procesar la solicitud', 'Error');
        }
        
        console.log('==========================================');
      },
      error: (error) => {
        console.error('==========================================');
        console.error('❌ ERROR AL MARCAR GRUPO');
        console.error('==========================================');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        console.error('Body:', error.error);
        console.error('==========================================');
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
  }

  /**
   * 🔗 Navegar al tablero pasando origen
   */
  goToTablero(grupoId: number, event?: MouseEvent) {
    if (event && (event.target as HTMLElement).closest('.grupo-options-modern')) {
      return;
    }
    
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
   * ✅ Toggle menú
   */
  toggleMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  /**
   * ✅ Cerrar menú
   */
  closeMenu() {
    this.openMenuId = null;
  }

  /**
   * ✅ Cerrar menú al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  closeMenuOnClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.grupo-options-modern') && !target.closest('.menu')) {
      this.openMenuId = null;
    }
  }

  /**
   * ✅ CORREGIDO: Cerrar menú y ejecutar acción
   */
  closeMenuAnd(action: string, grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🔧 Ejecutando acción:', action, 'para grupo:', grupo.id);
    
    // ✅ Cerrar menú inmediatamente
    this.closeMenu();
    
    // ✅ Ejecutar acción sin timeout
    switch (action) {
      case 'marcarGrupo':
        this.marcarGrupo(grupo);
        break;
      case 'shareGrupo':
        this.shareGrupo(grupo);
        break;
      case 'configPermisos':
        this.configPermisos(grupo);
        break;
      case 'editGrupo':
        this.editGrupo(grupo);
        break;
      case 'deleteGrupo':
        this.deleteGrupo(grupo);
        break;
    }
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
      return 'assets/media/avatars/1.png';
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
        console.error('Error al cargar miembros:', error);
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