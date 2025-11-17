import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../service/vista-documento.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteDocumentoComponent } from '../../documentos/delete-documento/delete-documento.component';
import { ViewVistaDocumentoComponent } from '../view-vista-documento/view-vista-documento.component';
import { CreateFolderComponent } from '../../documentos/create-folder/create-folder.component';
// NUEVO: Importar componente visor (si ya lo creaste)
// Si aún no tienes este componente, comenta esta línea
// import { DocumentViewerComponent } from '../../documentos/document-viewer/document-viewer.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
  isLoading$: any;

  sucursalId!: number;
  currentFolderId: number | null = null;
  currentPage: number = 1;

  // Breadcrumb para navegación
  breadcrumb: BreadcrumbItem[] = [];

  // Para drag and drop
  draggedItem: any = null;
  isDragging: boolean = false;

  constructor(
    public modalService: NgbModal,
    public viewDocumentoService: VistaDocumentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.viewDocumentoService.isLoading$;
    
    this.route.paramMap.subscribe(params => {
      this.sucursalId = Number(params.get('sucursalId'));
      this.currentFolderId = null;
      this.breadcrumb = [{ id: null, name: 'Raíz' }];
      this.listDocumentos();
    });
  }

  /**
   * Listar documentos de la ubicación actual
   */
  listDocumentos(page = 1) {
    this.viewDocumentoService.listViewDocumentos(
      page,
      this.search,
      this.sucursalId,
      this.currentFolderId
    ).subscribe({
      next: (resp: any) => {
        this.DOCUMENTOS = resp.documentos;
        this.currentPage = page;
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
   * Abrir carpeta y navegar a su contenido
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
   * Navegar a una ubicación del breadcrumb
   */
  navigateToBreadcrumb(index: number) {
    const item = this.breadcrumb[index];
    this.currentFolderId = item.id;
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.listDocumentos();
  }

  /**
   * Volver a la carpeta padre
   */
  goBack() {
    if (this.breadcrumb.length > 1) {
      this.breadcrumb.pop();
      const parent = this.breadcrumb[this.breadcrumb.length - 1];
      this.currentFolderId = parent.id;
      this.listDocumentos();
    }
  }

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
      Swal.fire({
        icon: 'success',
        title: 'Carpeta creada',
        text: `La carpeta "${folder.name}" ha sido creada exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });
    });
  }

  // ========== NUEVO: MÉTODOS PARA VISUALIZACIÓN Y DESCARGA ==========

  /**
   * Ver o abrir documento (dependiendo si es carpeta o archivo)
   * Este es el método que faltaba y causaba el error
   */
  viewOrOpenDocument(DOCUMENTO: any) {
    if (DOCUMENTO.type === 'folder') {
      this.openFolder(DOCUMENTO);
    } else {
      // Opción 1: Si ya tienes el DocumentViewerComponent
      // this.openDocumentViewer(DOCUMENTO);
      
      // Opción 2: Mientras no tengas el visor, usa el viewer antiguo
      this.viewDocumento(DOCUMENTO);
    }
  }

  /**
   * Abrir visor de documentos (nuevo componente)
   * Descomenta esto cuando tengas DocumentViewerComponent
   */
  /*
  openDocumentViewer(DOCUMENTO: any) {
    const modalRef = this.modalService.open(DocumentViewerComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    
    modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
  }
  */

  /**
   * Ver documento (método original - mantener por compatibilidad)
   */
  viewDocumento(DOCUMENTO: any) {
    if (DOCUMENTO.type === 'folder') {
      this.openFolder(DOCUMENTO);
    } else {
      const modalRef = this.modalService.open(ViewVistaDocumentoComponent, {
        centered: true,
        size: 'xl'
      });
      modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
    }
  }

  /**
   * Descargar documento directamente
   * NUEVO MÉTODO
   */
  downloadDocument(DOCUMENTO: any) {
    if (DOCUMENTO.type === 'folder') {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede descargar',
        text: 'No es posible descargar carpetas',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    this.viewDocumentoService.downloadDocument(DOCUMENTO.id).subscribe({
      next: (blob: Blob) => {
        // Crear URL temporal para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear link temporal y hacer click
        const link = document.createElement('a');
        link.href = url;
        link.download = DOCUMENTO.name;
        link.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          icon: 'success',
          title: 'Descarga iniciada',
          text: `${DOCUMENTO.name}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (err) => {
        console.error('Error downloading:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo descargar el archivo'
        });
      }
    });
  }

  // ========== FIN MÉTODOS NUEVOS ==========

  /**
   * Eliminar documento o carpeta
   */
  deleteDocumento(DOCUMENTO: any) {
    const type = DOCUMENTO.type === 'folder' ? 'carpeta' : 'documento';
    const warningMessage = DOCUMENTO.type === 'folder'
      ? `¿Estás seguro de eliminar la carpeta "${DOCUMENTO.name}"? Se eliminarán todos los archivos y subcarpetas dentro de ella.`
      : `¿Estás seguro de eliminar el documento "${DOCUMENTO.name}"?`;

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
        this.viewDocumentoService.deleteDocument(DOCUMENTO.id).subscribe({
          next: (resp: any) => {
            if (resp.message === 200) {
              const INDEX = this.DOCUMENTOS.findIndex((d: any) => d.id === DOCUMENTO.id);
              if (INDEX !== -1) {
                this.DOCUMENTOS.splice(INDEX, 1);
              }
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: `${type.charAt(0).toUpperCase() + type.slice(1)} eliminado exitosamente`,
                timer: 2000,
                showConfirmButton: false
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

  // ========== DRAG AND DROP ==========

  /**
   * Inicio del arrastre
   */
  onDragStart(event: DragEvent, item: any) {
    this.draggedItem = item;
    this.isDragging = true;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/html', event.target as any);
  }

  /**
   * Fin del arrastre
   */
  onDragEnd(event: DragEvent) {
    this.isDragging = false;
    this.draggedItem = null;
    
    // Remover clases de drop-zone
    document.querySelectorAll('.drop-zone-active').forEach(el => {
      el.classList.remove('drop-zone-active');
    });
  }

  /**
   * Permitir drop sobre carpeta
   */
  onDragOver(event: DragEvent, targetFolder: any) {
    if (!this.draggedItem || targetFolder.type !== 'folder') return;
    
    // No permitir arrastrar sobre sí mismo
    if (this.draggedItem.id === targetFolder.id) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  /**
   * Entrar en zona de drop
   */
  onDragEnter(event: DragEvent, targetFolder: any) {
    if (!this.draggedItem || targetFolder.type !== 'folder') return;
    if (this.draggedItem.id === targetFolder.id) return;

    const target = event.currentTarget as HTMLElement;
    target.classList.add('drop-zone-active');
  }

  /**
   * Salir de zona de drop
   */
  onDragLeave(event: DragEvent, targetFolder: any) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drop-zone-active');
  }

  /**
   * Soltar elemento en carpeta
   */
  onDrop(event: DragEvent, targetFolder: any) {
    event.preventDefault();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drop-zone-active');

    if (!this.draggedItem || targetFolder.type !== 'folder') return;
    if (this.draggedItem.id === targetFolder.id) return;

    // Mover el documento/carpeta
    this.moveDocument(this.draggedItem, targetFolder.id);
  }

  /**
   * Soltar en el área de la carpeta actual (raíz)
   */
  onDropInCurrentFolder(event: DragEvent) {
    event.preventDefault();
    
    if (!this.draggedItem) return;

    // Si ya está en la ubicación actual, no hacer nada
    if (this.draggedItem.parent_id === this.currentFolderId) return;

    this.moveDocument(this.draggedItem, this.currentFolderId);
  }

  /**
   * Mover documento/carpeta a nueva ubicación
   */
  moveDocument(item: any, targetParentId: number | null) {
    const data = {
      parent_id: targetParentId
    };

    this.viewDocumentoService.moveDocument(item.id, data).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          // Remover de la lista actual
          const INDEX = this.DOCUMENTOS.findIndex((d: any) => d.id === item.id);
          if (INDEX !== -1) {
            this.DOCUMENTOS.splice(INDEX, 1);
          }

          Swal.fire({
            icon: 'success',
            title: 'Movido',
            text: `"${item.name}" ha sido movido exitosamente`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (err) => {
        console.error('Error moving document:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message_text || 'Error al mover el elemento'
        });
      }
    });
  }

  /**
   * Obtener icono según tipo de archivo
   */
  getFileIcon(documento: any): string {
    if (documento.type === 'folder') {
      return 'ki-folder';
    }

    const mimeType = documento.mime_type?.toLowerCase() || '';
    
    if (mimeType.includes('pdf')) return 'ki-file-pdf';
    if (mimeType.includes('image')) return 'ki-file-jpg';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'ki-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'ki-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ki-file-powerpoint';
    if (mimeType.includes('text')) return 'ki-file-text';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ki-file-zip';
    
    return 'ki-file';
  }

  /**
   * Obtener clase de color según tipo
   */
  getFileIconClass(documento: any): string {
    if (documento.type === 'folder') {
      return 'text-warning';
    }

    const mimeType = documento.mime_type?.toLowerCase() || '';
    
    if (mimeType.includes('pdf')) return 'text-danger';
    if (mimeType.includes('image')) return 'text-success';
    if (mimeType.includes('word')) return 'text-primary';
    if (mimeType.includes('excel')) return 'text-success';
    
    return 'text-gray-600';
  }
}