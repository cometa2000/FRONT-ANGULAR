import { Component, HostListener, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { CreateGrupoComponent } from '../create-grupo/create-grupo.component';
import { EditGrupoComponent } from '../edit-grupo/edit-grupo.component';
import { DeleteGrupoComponent } from '../delete-grupo/delete-grupo.component';
import { ShareGrupoComponent } from '../share-grupo/share-grupo.component';
import { ToastrService } from 'ngx-toastr';
import { PermisosGrupoModalComponent } from '../permisos-grupo-modal/permisos-grupo-modal.component';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-list-grupo',
  templateUrl: './list-grupo.component.html',
  styleUrls: ['./list-grupo.component.scss']
})
export class ListGrupoComponent {
  search: string = '';
  GRUPOS: any = [];
  isLoading$: any;

  totalPages: number = 0;
  currentPage: number = 1;

  openMenuId: number | null = null;
  
  // Control de tooltip
  activeTooltip: number | null = null;
  showAllUsers: { [key: number]: boolean } = {};

  // Variables para el modal de miembros
  selectedGrupo: any = null;
  miembrosGrupo: any[] = [];
  loadingMiembros: boolean = false;

  constructor(
    public modalService: NgbModal,
    public grupoService: GrupoService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.grupoService.isLoading$;
    this.listGrupos();
  }

  listGrupos(page = 1) {
    this.grupoService.listGrupos(page, this.search).subscribe((resp: any) => {
      console.log('Grupos cargados:', resp);
      this.GRUPOS = resp.grupos;
      this.totalPages = resp.total;
      this.currentPage = page;
    });
  }

  loadPage($event: any) {
    this.listGrupos($event);
  }

  createGrupo() {
    const modalRef = this.modalService.open(CreateGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GrupoC.subscribe((grupo: any) => {
      this.GRUPOS.unshift(grupo);
    });
  }

  editGrupo(grupo: any) {
    const modalRef = this.modalService.open(EditGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoE.subscribe((grupoEditado: any) => {
      const index = this.GRUPOS.findIndex((g: any) => g.id === grupo.id);
      if (index !== -1) this.GRUPOS[index] = grupoEditado;
    });
  }

  deleteGrupo(grupo: any) {
    const modalRef = this.modalService.open(DeleteGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoD.subscribe(() => {
      this.GRUPOS = this.GRUPOS.filter((g: any) => g.id !== grupo.id);
    });
  }

  shareGrupo(grupo: any) {
    const modalRef = this.modalService.open(ShareGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoShared.subscribe(() => {
      this.listGrupos(this.currentPage);
    });
  }

  // ⭐ Marcar/Desmarcar grupo
  marcarGrupo(grupo: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    
    this.grupoService.toggleStar(grupo.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          grupo.is_starred = resp.is_starred;
          const message = grupo.is_starred ? 'Grupo marcado' : 'Marca removida';
          this.toast.success(message, 'Éxito');
          
          // Reordenar lista para mostrar primero los marcados
          this.GRUPOS.sort((a: any, b: any) => {
            if (a.is_starred === b.is_starred) return 0;
            return a.is_starred ? -1 : 1;
          });
        }
      },
      error: (error) => {
        console.error('Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
  }

  // 👥 Ver miembros del grupo - ✅ VERSIÓN CORREGIDA
  verMiembros(grupo: any, event?: MouseEvent) {
    // Evitar que se propague el evento (para que no abra el link del grupo)
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🔍 Ver miembros del grupo:', grupo.id);
    console.log('📋 Grupo completo:', grupo);
    
    // ✅ PASO 1: Establecer el grupo seleccionado (copia completa del objeto)
    this.selectedGrupo = { ...grupo }; // ← Hacer copia para evitar mutación
    
    // ✅ PASO 2: Limpiar miembros anteriores
    this.miembrosGrupo = [];
    
    // ✅ PASO 3: Mostrar loading
    this.loadingMiembros = true;
    
    // ✅ PASO 4: Abrir el modal ANTES de cargar los datos (con loading visible)
    this.openMiembrosModal();
    
    // ✅ PASO 5: Cargar los miembros del grupo desde el backend
    this.grupoService.getSharedUsers(grupo.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de miembros:', resp);
        
        if (resp.message === 200) {
          // ✅ Asignar los miembros compartidos
          this.miembrosGrupo = resp.shared_users || [];
          
          // ✅ Actualizar selectedGrupo con la info de shared_with
          this.selectedGrupo.shared_with = resp.shared_users || [];
          
          console.log('👥 Miembros cargados:', this.miembrosGrupo);
          console.log('📊 Total de miembros:', this.miembrosGrupo.length);
          console.log('📋 selectedGrupo actualizado:', this.selectedGrupo);
        } else {
          console.warn('⚠️ Respuesta inesperada del servidor:', resp);
          this.toast.warning('No se pudieron cargar los miembros', 'Advertencia');
        }
        
        // ✅ CRÍTICO: Desactivar loading
        this.loadingMiembros = false;
        
        // ✅ SOLUCIÓN: Forzar detección de cambios
        this.cdr.detectChanges();
        
        console.log('✅ Vista actualizada, loading:', this.loadingMiembros);
      },
      error: (error) => {
        console.error('❌ Error al cargar miembros:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        this.loadingMiembros = false;
        this.cdr.detectChanges(); // ✅ También forzar en error
        this.toast.error('No se pudieron cargar los miembros del grupo', 'Error');
        
        // ✅ Cerrar el modal si hay error
        this.closeMiembrosModal();
      }
    });
  }

  // ✅ Método mejorado para abrir el modal de miembros
  openMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');
    
    if (!modalElement) {
      console.error('❌ Modal element not found');
      return;
    }
    
    // Verificar si Bootstrap está disponible
    if (typeof (window as any).bootstrap !== 'undefined') {
      // Usar Bootstrap 5 nativo
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
      
      console.log('✅ Modal abierto con Bootstrap 5');
    } else {
      // Alternativa: agregar clase show manualmente
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');
      
      // Crear backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'miembros-backdrop';
      document.body.appendChild(backdrop);
      
      console.log('✅ Modal abierto manualmente');
    }
  }

  // ✅ Cerrar modal manualmente
  closeMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');
    const backdrop = document.getElementById('miembros-backdrop');
    
    if (modalElement) {
      // Si Bootstrap está disponible, usarlo
      if (typeof (window as any).bootstrap !== 'undefined') {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        // Cerrar manualmente
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
    
    if (backdrop) {
      backdrop.remove();
    }
    
    // ✅ Limpiar datos al cerrar
    setTimeout(() => {
      this.selectedGrupo = null;
      this.miembrosGrupo = [];
      this.loadingMiembros = false;
    }, 300);
    
    console.log('✅ Modal cerrado');
  }

  // 🔄 Abrir modal de compartir desde el modal de miembros
  openShareModal() {
    // ✅ OPCIÓN 1: Buscar el grupo actualizado desde la lista GRUPOS
    const grupoActualizado = this.GRUPOS.find((g: any) => g.id === this.selectedGrupo.id);
    
    // Cerrar el modal de miembros primero
    this.closeMiembrosModal();
    
    if (grupoActualizado) {
      console.log('✅ Grupo encontrado en GRUPOS, abriendo modal de compartir');
      
      // Abrir el modal de compartir con el grupo de la lista
      setTimeout(() => {
        this.shareGrupo(grupoActualizado);
      }, 300);
    } else {
      console.warn('⚠️ Grupo no encontrado en GRUPOS, cargando desde servidor...');
      
      // ✅ OPCIÓN 2 (FALLBACK): Si no está en la lista, usar el selectedGrupo directamente
      // Esto puede pasar si el usuario cambió de página en la lista
      setTimeout(() => {
        this.shareGrupo(this.selectedGrupo);
      }, 300);
    }
  }

  // ⚙️ Toggle del menú de opciones
  toggleMenu(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  // 🚫 Cerrar menú al hacer clic fuera
  @HostListener('document:click', ['$event'])
  closeMenu(event: MouseEvent) {
    this.openMenuId = null;
  }

  // Mostrar tooltip
  showTooltip(grupoId: number) {
    this.activeTooltip = grupoId;
  }

  // Ocultar tooltip
  hideTooltip(grupoId: number) {
    this.activeTooltip = null;
  }

  // Método auxiliar para cerrar menú y ejecutar acción
  closeMenuAnd(action: string, grupo: any) {
    this.openMenuId = null;
    switch (action) {
      case 'marcarGrupo':
        this.marcarGrupo(grupo);
        break;
      case 'shareGrupo':
        this.shareGrupo(grupo);
        break;
      case 'configPermisos':
        this.openPermissionsModal(grupo);
        break;
      case 'editGrupo':
        this.editGrupo(grupo);
        break;
      case 'deleteGrupo':
        this.deleteGrupo(grupo);
        break;
    }
  }

  openPermissionsModal(grupo: any) {
    // Solo el propietario puede acceder a los permisos
    if (!grupo.is_owner) {
      this.toast.warning('Solo el creador del grupo puede gestionar permisos');
      return;
    }

    const modalRef = this.modalService.open(PermisosGrupoModalComponent, {
      centered: true,
      size: 'md'
    });
    
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    
    modalRef.componentInstance.PermisosChanged.subscribe((grupoActualizado: any) => {
      // Actualizar el grupo en la lista si es necesario
      const index = this.GRUPOS.findIndex((g: any) => g.id === grupoActualizado.id);  // ✅ CAMBIAR A GRUPOS
      if (index !== -1) {
        this.GRUPOS[index] = { ...this.GRUPOS[index], ...grupoActualizado };  // ✅ CAMBIAR A GRUPOS
      }
      this.toast.success('Permisos actualizados correctamente');
    });
  }
}