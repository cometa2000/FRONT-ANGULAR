import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../service/vista-documento.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewVistaDocumentoComponent } from '../view-vista-documento/view-vista-documento.component';
import { CreateFolderComponent } from '../../documentos/create-folder/create-folder.component';
import { CreateDocumentoComponent } from '../../documentos/create-documento/create-documento.component';
import { MoveDocumentoComponent } from '../../documentos/move-documento/move-documento.component';
import Swal from 'sweetalert2';

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

@Component({
  selector: 'app-list-vista-documento',
  templateUrl: './list-vista-documento.component.html',
  styleUrls: ['./list-vista-documento.component.scss']
})
export class ListVistaDocumentoComponent implements OnInit {
  search: string = '';
  DOCUMENTOS: any[] = [];
  sortedDocumentos: any[] = [];
  isLoading$: any;

  sucursalId!: number;
  currentFolderId: number | null = null;
  currentPage: number = 1;
  
  currentUser: any = null;
  isAdmin: boolean = false;

  // Breadcrumb
  breadcrumb: BreadcrumbItem[] = [];

  // Ordenamiento
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    public modalService: NgbModal,
    public vistaDocumentoService: VistaDocumentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.vistaDocumentoService.isLoading$;
    
    // Obtener configuración para saber el usuario actual
    this.vistaDocumentoService.getConfig().subscribe({
      next: (resp: any) => {
        this.currentUser = resp.user;
        this.isAdmin = resp.user?.is_admin || resp.user?.role_id === 1;
      },
      error: (err) => console.error('Error loading config:', err)
    });
    
    this.route.paramMap.subscribe(params => {
      this.sucursalId = Number(params.get('sucursalId'));
      this.currentFolderId = null;
      this.breadcrumb = [{ id: null, name: 'Raíz' }];
      this.listDocumentos();
    });
  }

  /**
   * Listar documentos
   */
  listDocumentos(page = 1) {
    this.vistaDocumentoService.listViewDocumentos(
      page,
      this.search,
      this.sucursalId,
      this.currentFolderId
    ).subscribe({
      next: (resp: any) => {
        this.DOCUMENTOS = resp.documentos || [];
        this.currentPage = page;
        this.applySorting();
        
        // Marcar como visto después de un delay
        this.markNewDocumentsAsViewed();
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los documentos'
        });
      }
    });
  }

  /**
   * Marcar documentos nuevos como vistos después de 2 segundos
   */
  private markNewDocumentsAsViewed() {
    setTimeout(() => {
      const newDocs = this.DOCUMENTOS.filter(d => d.is_new && d.type === 'file');
      
      newDocs.forEach(doc => {
        this.vistaDocumentoService.markAsViewed(doc.id).subscribe({
          next: () => {
            // Actualizar localmente
            doc.is_new = false;
          },
          error: (err) => console.error('Error marking as viewed:', err)
        });
      });
    }, 2000);
  }

  // ========== NAVEGACIÓN ==========

  /**
   * Abrir carpeta
   */
  openFolder(folder: any) {
    if (folder.type !== 'folder') return;

    this.currentFolderId = folder.id;
    this.breadcrumb.push({
      id: folder.id,
      name: folder.name
    });
    this.listDocumentos();
  }

  /**
   * Navegar a breadcrumb
   */
  navigateToBreadcrumb(index: number) {
    const item = this.breadcrumb[index];
    this.currentFolderId = item.id;
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.listDocumentos();
  }

  /**
   * Volver atrás
   */
  goBack() {
    if (this.breadcrumb.length > 1) {
      this.breadcrumb.pop();
      const parent = this.breadcrumb[this.breadcrumb.length - 1];
      this.currentFolderId = parent.id;
      this.listDocumentos();
    }
  }

  // ========== ORDENAMIENTO ==========

  /**
   * Ordenar por columna
   */
  sortBy(column: string) {
    if (this.sortColumn === column) {
      // Cambiar dirección
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  /**
   * Aplicar ordenamiento
   */
  private applySorting() {
    this.sortedDocumentos = [...this.DOCUMENTOS].sort((a, b) => {
      // Siempre mostrar carpetas primero
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;

      let comparison = 0;

      switch (this.sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;

        case 'user':
          const userA = `${a.user?.name || ''} ${a.user?.surname || ''}`.trim();
          const userB = `${b.user?.name || ''} ${b.user?.surname || ''}`.trim();
          comparison = userA.localeCompare(userB);
          break;

        case 'updated_at':
          const dateA = new Date(a.updated_at || 0).getTime();
          const dateB = new Date(b.updated_at || 0).getTime();
          comparison = dateA - dateB;
          break;

        case 'size':
          const sizeA = a.type === 'file' ? (parseInt(a.size) || 0) : 0;
          const sizeB = b.type === 'file' ? (parseInt(b.size) || 0) : 0;
          comparison = sizeA - sizeB;
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // ========== ACCIONES ==========

  /**
   * Crear nueva carpeta
   */
  createFolder() {
    const modalRef = this.modalService.open(CreateFolderComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.sucursale_id = this.sucursalId;
    modalRef.componentInstance.parent_id = this.currentFolderId;
    modalRef.componentInstance.parent_name = this.breadcrumb[this.breadcrumb.length - 1].name;

    modalRef.componentInstance.FolderCreated.subscribe((folder: any) => {
      this.DOCUMENTOS.unshift(folder);
      this.applySorting();
      
      Swal.fire({
        icon: 'success',
        title: 'Carpeta creada',
        text: `La carpeta "${folder.name}" ha sido creada exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  /**
   * Subir documento(s)
   */
  uploadDocumento() {
    const modalRef = this.modalService.open(CreateDocumentoComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });

    // Pasar contexto actual
    modalRef.componentInstance.sucursale_id = this.sucursalId;
    modalRef.componentInstance.parent_id = this.currentFolderId;

    modalRef.componentInstance.DocumentosCreated.subscribe((documentos: any[]) => {
      if (Array.isArray(documentos)) {
        this.DOCUMENTOS.unshift(...documentos);
      } else {
        this.DOCUMENTOS.unshift(documentos);
      }
      
      this.applySorting();
    });
  }

  /**
   * Ver documento o abrir carpeta
   */
  viewDocumento(DOCUMENTO: any) {
    if (DOCUMENTO.type === 'folder') {
      this.openFolder(DOCUMENTO);
    } else {
      // Marcar como visto
      if (DOCUMENTO.is_new) {
        this.vistaDocumentoService.markAsViewed(DOCUMENTO.id).subscribe({
          next: () => {
            DOCUMENTO.is_new = false;
          }
        });
      }

      const modalRef = this.modalService.open(ViewVistaDocumentoComponent, {
        centered: true,
        size: 'xl'
      });
      modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
    }
  }

  /**
   * Mover documento o carpeta
   */
  moveDocumento(DOCUMENTO: any) {
    const modalRef = this.modalService.open(MoveDocumentoComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
    modalRef.componentInstance.sucursale_id = this.sucursalId;
    modalRef.componentInstance.current_parent_id = this.currentFolderId;

    modalRef.componentInstance.DocumentoMoved.subscribe(() => {
      // Recargar la lista para reflejar los cambios
      this.listDocumentos();
    });
  }

  /**
   * Verificar si el usuario puede eliminar un documento
   */
  canDelete(DOCUMENTO: any): boolean {
    // Admin puede eliminar todo
    if (this.isAdmin) {
      return true;
    }

    // Usuario normal solo puede eliminar lo que él creó
    if (this.currentUser && DOCUMENTO.user_id === this.currentUser.id) {
      return true;
    }

    return false;
  }

  /**
   * Eliminar documento
   */
  deleteDocumento(DOCUMENTO: any) {
    const type = DOCUMENTO.type === 'folder' ? 'carpeta' : 'documento';
    
    let warningMessage = DOCUMENTO.type === 'folder'
      ? `¿Estás seguro de eliminar la carpeta "${DOCUMENTO.name}"?`
      : `¿Estás seguro de eliminar el documento "${DOCUMENTO.name}"?`;

    // Si es una carpeta con contenido, agregar advertencia
    if (DOCUMENTO.type === 'folder' && (DOCUMENTO.files_count > 0 || DOCUMENTO.children_count > 0)) {
      warningMessage += `\n\nEsta carpeta contiene ${DOCUMENTO.files_count} archivo(s). Al eliminarla, su contenido se moverá a la raíz.`;
    }

    Swal.fire({
      icon: 'warning',
      title: `Eliminar ${type}`,
      text: warningMessage,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vistaDocumentoService.deleteDocument(DOCUMENTO.id).subscribe({
          next: (resp: any) => {
            if (resp.message === 200) {
              const INDEX = this.DOCUMENTOS.findIndex((d: any) => d.id === DOCUMENTO.id);
              if (INDEX !== -1) {
                this.DOCUMENTOS.splice(INDEX, 1);
                this.applySorting();
              }
              
              let successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} eliminado exitosamente`;
              
              if (resp.moved_children) {
                successMessage = resp.message_text;
                // Recargar para mostrar los elementos movidos
                this.listDocumentos();
              }
              
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: successMessage,
                timer: resp.moved_children ? 3500 : 2000,
                showConfirmButton: resp.moved_children
              });
            }
          },
          error: (err) => {
            console.error('Error deleting:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `Error al eliminar el ${type}`
            });
          }
        });
      }
    });
  }

  // ========== HELPERS ==========

  /**
   * Obtener iniciales del usuario
   */
  getInitials(name: string, surname: string): string {
    const n = name ? name.charAt(0).toUpperCase() : '';
    const s = surname ? surname.charAt(0).toUpperCase() : '';
    return n + s || 'U';
  }

  /**
   * Obtener ícono según tipo de archivo
   */
  getFileIcon(documento: any): string {
    if (documento.type === 'folder') {
      return 'ki-duotone ki-folder';
    }

    const mimeType = documento.mime_type?.toLowerCase() || '';
    
    if (mimeType.includes('pdf')) return 'ki-duotone ki-file-pdf';
    if (mimeType.includes('image')) return 'ki-duotone ki-file-jpg';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'ki-duotone ki-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ki-duotone ki-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ki-duotone ki-file-powerpoint';
    if (mimeType.includes('text')) return 'ki-duotone ki-file-text';
    
    return 'ki-duotone ki-file';
  }

  /**
   * Obtener clase de fondo del ícono
   */
  getFileIconClass(documento: any): string {
    const mimeType = documento.mime_type?.toLowerCase() || '';
    
    if (mimeType.includes('pdf')) return 'bg-light-danger';
    if (mimeType.includes('image')) return 'bg-light-success';
    if (mimeType.includes('word')) return 'bg-light-primary';
    if (mimeType.includes('excel')) return 'bg-light-success';
    if (mimeType.includes('powerpoint')) return 'bg-light-warning';
    if (mimeType.includes('text')) return 'bg-light-info';
    
    return 'bg-light-secondary';
  }

  /**
   * Obtener color del ícono
   */
  getFileIconColor(documento: any): string {
    if (documento.type === 'folder') {
      return 'text-warning';
    }

    const mimeType = documento.mime_type?.toLowerCase() || '';
    
    if (mimeType.includes('pdf')) return 'text-danger';
    if (mimeType.includes('image')) return 'text-success';
    if (mimeType.includes('word')) return 'text-primary';
    if (mimeType.includes('excel')) return 'text-success';
    if (mimeType.includes('powerpoint')) return 'text-warning';
    
    return 'text-gray-600';
  }
}