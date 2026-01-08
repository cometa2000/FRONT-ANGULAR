import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';
import { GrupoService } from '../../grupos/service/grupo.service';
import { EditGrupoComponent } from '../../grupos/edit-grupo/edit-grupo.component';
import { ShareGrupoComponent } from '../../grupos/share-grupo/share-grupo.component';
import { PermisosGrupoModalComponent } from '../../grupos/permisos-grupo-modal/permisos-grupo-modal.component';

@Component({
  selector: 'app-share-workspace',
  templateUrl: './share-workspace.component.html',
  styleUrls: ['./share-workspace.component.scss']
})
export class ShareWorkspaceComponent implements OnInit {
  
  search: string = '';
  SHARED_GRUPOS: any[] = [];
  isLoading$: any;
  
  // Control de menús
  openGrupoMenuId: number | null = null;
  activeTooltip: number | null = null;

  constructor(
    private workspaceService: WorkspaceService,
    private grupoService: GrupoService,
    private modalService: NgbModal,
    private toast: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.grupoService.isLoading$;
    this.loadSharedGrupos();
  }

  /**
   * 📋 Cargar grupos compartidos con el usuario
   */
  loadSharedGrupos() {
    this.grupoService.listGrupos(1, this.search).subscribe({
      next: (resp: any) => {
        console.log('📤 Grupos compartidos cargados:', resp);
        if (resp.message === 200) {
          // Filtrar solo los grupos donde el usuario NO es el propietario
          this.SHARED_GRUPOS = (resp.grupos?.data || []).filter(
            (grupo: any) => !grupo.is_owner
          );
          
          console.log(`✅ Total grupos compartidos: ${this.SHARED_GRUPOS.length}`);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar grupos compartidos:', error);
        this.toast.error('Error al cargar grupos compartidos', 'Error');
      }
    });
  }

  /**
   * 🔍 Buscar grupos compartidos
   */
  searchGrupos() {
    this.loadSharedGrupos();
  }

  /**
   * ✏️ Editar grupo (solo si tiene permisos de escritura)
   */
  editGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Verificar permisos
    if (grupo.user_permission === 'read') {
      this.toast.warning('Solo tienes permisos de lectura en este grupo', 'Sin permisos');
      return;
    }
    
    const modalRef = this.modalService.open(EditGrupoComponent, { 
      centered: true, 
      size: 'md' 
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoE.subscribe(() => {
      this.loadSharedGrupos();
    });
    
    this.closeGrupoMenu();
  }

  /**
   * 📤 Ver quién comparte el grupo
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
      this.loadSharedGrupos();
    });
    
    this.closeGrupoMenu();
  }

  /**
   * ⚙️ Ver permisos del grupo
   */
  viewPermissions(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const modalRef = this.modalService.open(PermisosGrupoModalComponent, {
      centered: true,
      size: 'md'
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.PermisosChanged.subscribe(() => {
      this.loadSharedGrupos();
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
          this.loadSharedGrupos();
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
   * 🔗 Navegar al tablero del grupo
   */
  goToTablero(grupoId: number) {
    this.router.navigate(['/tasks/tareas/tablero', grupoId]);
  }

  /**
   * 🔧 Toggle menú grupo
   */
  toggleGrupoMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openGrupoMenuId = this.openGrupoMenuId === id ? null : id;
  }

  /**
   * 🚫 Cerrar menú
   */
  closeGrupoMenu() {
    this.openGrupoMenuId = null;
  }

  /**
   * 🚫 Cerrar menú al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  closeMenuOnClickOutside() {
    this.openGrupoMenuId = null;
  }

  /**
   * 🎨 Obtener URL de imagen de grupo
   */
  getGrupoImageUrl(imagen: string): string {
    if (!imagen) {
      return 'assets/media/fondos/fondo1.png'; // Imagen por defecto
    }
    
    // Si es solo el nombre del archivo (ej: "fondo4.png")
    if (!imagen.includes('/') && !imagen.includes('http')) {
      return `assets/media/fondos/${imagen}`;
    }
    
    // Si ya tiene la ruta completa
    return imagen;
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
   * 🏷️ Obtener etiqueta de permiso
   */
  getPermissionLabel(permissionLevel: string): string {
    const labels: any = {
      'read': 'Solo lectura',
      'write': 'Lectura y escritura'
    };
    return labels[permissionLevel] || permissionLevel;
  }

  /**
   * 🎨 Obtener clase de permiso
   */
  getPermissionClass(permissionLevel: string): string {
    return permissionLevel === 'read' ? 'badge-light-warning' : 'badge-light-success';
  }

  /**
   * 👁️ Mostrar tooltip
   */
  showTooltip(grupoId: number) {
    this.activeTooltip = grupoId;
  }

  /**
   * 🚫 Ocultar tooltip
   */
  hideTooltip() {
    this.activeTooltip = null;
  }
}