import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';
import { GrupoService } from '../../grupos/service/grupo.service';

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

  // 🆕 Variables para el modal de miembros
  selectedGrupo: any = null;
  miembrosGrupo: any[] = [];
  loadingMiembros: boolean = false;

  constructor(
    private workspaceService: WorkspaceService,
    private grupoService: GrupoService,
    private modalService: NgbModal,
    private toast: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.grupoService.isLoading$;
    this.loadSharedGrupos();
  }

  /**
   * ✅ Cargar grupos compartidos con el usuario
   */
  loadSharedGrupos() {
    console.log('🔄 Cargando grupos compartidos...');
    
    this.grupoService.listGrupos(1, this.search).subscribe({
      next: (resp: any) => {
        console.log('📤 Respuesta completa del servidor:', resp);
        
        if (resp.message === 200) {
          const allGrupos = resp.grupos?.data || [];
          
          console.log(`📦 Total de grupos recibidos: ${allGrupos.length}`);
          
          // Debug de todos los grupos
          allGrupos.forEach((grupo: any) => {
            console.log(`📋 Grupo "${grupo.name}":`, {
              id: grupo.id,
              is_owner: grupo.is_owner,
              user_permission: grupo.user_permission,
              permission_level: grupo.permission_level,
              has_write_access: grupo.has_write_access,
              user_id: grupo.user_id,
              shared_with_count: grupo.shared_with?.length || 0
            });
          });
          
          this.SHARED_GRUPOS = allGrupos.filter((grupo: any) => {
            const notOwner = grupo.is_owner === false;
            const hasValidPermission = grupo.user_permission && 
                                      grupo.user_permission !== 'none' &&
                                      grupo.user_permission !== 'owner';
            
            const isSharedWithMe = notOwner && hasValidPermission;
            
            if (isSharedWithMe) {
              console.log(`✅ Grupo compartido encontrado: "${grupo.name}" (${grupo.user_permission})`);
            }
            
            return isSharedWithMe;
          });
          
          console.log(`✅ Total grupos compartidos conmigo: ${this.SHARED_GRUPOS.length}`);
          
          if (this.SHARED_GRUPOS.length > 0) {
            console.log('📊 Grupos filtrados:', this.SHARED_GRUPOS.map(g => ({
              id: g.id,
              name: g.name,
              owner: g.user?.name,
              permission: g.user_permission
            })));
          } else {
            console.warn('⚠️ No se encontraron grupos compartidos. Verifica que:');
            console.warn('   1. Otros usuarios han compartido grupos contigo');
            console.warn('   2. El backend está enviando user_permission correctamente');
            console.warn('   3. La tabla grupo_user tiene registros para tu usuario');
          }
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
   * 👥 Ver miembros del grupo
   */
  shareGrupo(grupo: any, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('👥 Ver miembros del grupo:', grupo.id);
    
    this.selectedGrupo = { ...grupo };
    this.miembrosGrupo = [];
    this.loadingMiembros = true;
    
    this.openMiembrosModal();
    
    this.grupoService.getSharedUsers(grupo.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de miembros:', resp);
        
        if (resp.message === 200) {
          this.miembrosGrupo = resp.shared_users || [];
          this.selectedGrupo.shared_with = resp.shared_users || [];
          
          console.log('👥 Miembros cargados:', this.miembrosGrupo);
        } else {
          console.warn('⚠️ Respuesta inesperada del servidor:', resp);
          this.toast.warning('No se pudieron cargar los miembros', 'Advertencia');
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
    
    this.closeGrupoMenu();
  }

  /**
   * 🆕 Abrir modal de miembros
   */
  openMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');
    
    if (!modalElement) {
      console.error('❌ Modal element not found');
      return;
    }
    
    if (typeof (window as any).bootstrap !== 'undefined') {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
      console.log('✅ Modal abierto con Bootstrap 5');
    } else {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');
      
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'miembros-backdrop';
      document.body.appendChild(backdrop);
      
      console.log('✅ Modal abierto manualmente');
    }
  }

  /**
   * 🆕 Cerrar modal de miembros
   */
  closeMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');
    const backdrop = document.getElementById('miembros-backdrop');
    
    if (modalElement) {
      if (typeof (window as any).bootstrap !== 'undefined') {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
    
    if (backdrop) {
      backdrop.remove();
    }
    
    setTimeout(() => {
      this.selectedGrupo = null;
      this.miembrosGrupo = [];
      this.loadingMiembros = false;
    }, 300);
    
    console.log('✅ Modal cerrado');
  }

  /**
   * 🎨 Obtener avatar del propietario
   */
  getUserAvatar(): string {
    const userToCheck = this.selectedGrupo?.user;
    
    if (userToCheck?.avatar) {
      return this.resolveAvatarPath(userToCheck.avatar);
    }
    
    return 'assets/media/avatars/1.png';
  }

  /**
   * 🎨 Obtener avatar de un miembro
   */
  getMemberAvatar(member: any): string {
    if (member?.avatar) {
      return this.resolveAvatarPath(member.avatar);
    }
    
    return 'assets/media/avatars/1.png';
  }

  /**
   * 🔧 Resolver ruta del avatar
   */
  private resolveAvatarPath(avatar: string): string {
    if (!avatar) {
      return 'assets/media/avatars/1.png';
    }

    if (/^\d+$/.test(avatar)) {
      return `assets/media/avatars/${avatar}.png`;
    }

    if (/^\d+\.(png|jpg|jpeg|gif)$/i.test(avatar)) {
      return `assets/media/avatars/${avatar}`;
    }

    if (avatar.includes('http') || avatar.includes('storage')) {
      return avatar;
    }

    return `assets/media/avatars/${avatar}`;
  }

  /**
   * ⭐ CORREGIDO: Marcar/Desmarcar grupo como favorito
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
          // ✅ Actualizar el estado local inmediatamente
          grupo.is_starred = resp.is_starred;
          
          // ✅ Actualizar también en el array principal
          const grupoIndex = this.SHARED_GRUPOS.findIndex((g: any) => g.id === grupo.id);
          if (grupoIndex !== -1) {
            this.SHARED_GRUPOS[grupoIndex].is_starred = resp.is_starred;
          }
          
          const message = resp.is_starred ? 'Grupo marcado como favorito' : 'Grupo desmarcado';
          this.toast.success(message, 'Éxito');
          
          // ✅ Forzar detección de cambios
          this.cdr.detectChanges();
          
          console.log('✅ Grupo actualizado correctamente');
        }
      },
      error: (error) => {
        console.error('❌ Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
    
    // ✅ Cerrar menú inmediatamente
    this.closeGrupoMenu();
  }

  /**
   * 🔗 Navegar al tablero del grupo
   */
  goToTablero(grupoId: number, event?: MouseEvent) {
    if (event && (event.target as HTMLElement).closest('.grupo-options')) {
      return;
    }
    
    console.log('🔗 Navegando al tablero del grupo:', grupoId, 'desde share-workspace');
    this.router.navigate(['/tasks/tareas/tablero', grupoId], {
      queryParams: { from: 'share-workspace' }
    });
  }

  /**
   * 🔧 Toggle menú grupo
   */
  toggleGrupoMenu(id: number, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.openGrupoMenuId = this.openGrupoMenuId === id ? null : id;
    console.log('🔧 Menú grupo toggled:', this.openGrupoMenuId);
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
  closeMenuOnClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Verificar si el clic fue dentro de un menú o botón de menú
    if (!target.closest('.grupo-options') && !target.closest('.menu')) {
      this.openGrupoMenuId = null;
    }
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

  /**
   * 🎨 Obtener avatar del usuario
   */
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

  /**
   * 🏷️ Obtener etiqueta de permiso
   */
  getPermissionLabel(permissionLevel: string): string {
    const labels: any = {
      'read': 'Solo lectura',
      'write': 'Lectura y escritura',
      'owner': 'Propietario'
    };
    return labels[permissionLevel] || permissionLevel;
  }

  /**
   * 🎨 Obtener clase de permiso
   */
  getPermissionClass(permissionLevel: string): string {
    const classes: any = {
      'read': 'badge-light-warning',
      'write': 'badge-light-success',
      'owner': 'badge-light-primary'
    };
    return classes[permissionLevel] || 'badge-light-secondary';
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