import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../service/vista-documento.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewVistaDocumentoComponent } from '../view-vista-documento/view-vista-documento.component';
import { CreateFolderComponent } from '../../documentos/create-folder/create-folder.component';
import { CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
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

  // Selección múltiple
  selectedDocuments: any[] = [];

  // Drag & Drop (CDK)
  isDragging: boolean = false;
  draggedItems: any[] = [];
  dragPreviewVisible: boolean = false;
  dragPreviewPosition = { x: 0, y: 0 };

  hoverFolderId: number | null = null;
  isOverRoot: boolean = false;

  // Para evitar que un drop dispare el click (abrir doc/carpeta)
  private dragEndedRecently: boolean = false;

  @ViewChild('rootDropZone', { static: false }) rootDropZone?: ElementRef<HTMLDivElement>;

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
      this.selectedDocuments = [];
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
        this.selectedDocuments = [];
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
    this.selectedDocuments = [];
    this.listDocumentos();
  }

  /**
   * Navegar a una ubicación del breadcrumb
   */
  navigateToBreadcrumb(index: number) {
    const item = this.breadcrumb[index];
    this.currentFolderId = item.id;
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    this.selectedDocuments = [];
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
      this.selectedDocuments = [];
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

  // ========== VISUALIZACIÓN Y DESCARGA ==========

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
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = DOCUMENTO.name;
        link.click();
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
              this.selectedDocuments = this.selectedDocuments.filter(d => d.id !== DOCUMENTO.id);
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

  // ========== SELECCIÓN MÚLTIPLE ==========

  isSelected(documento: any): boolean {
    return this.selectedDocuments.some(d => d.id === documento.id);
  }

  toggleSelection(documento: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    if (checked) {
      if (!this.isSelected(documento)) {
        this.selectedDocuments.push(documento);
      }
    } else {
      this.selectedDocuments = this.selectedDocuments.filter(d => d.id !== documento.id);
    }
  }

  // Click en la tarjeta (separado del drag)
  onCardClick(documento: any, event: MouseEvent): void {
    // Si venimos de un drag, NO abrir nada
    if (this.isDragging || this.dragEndedRecently) {
      event.stopPropagation();
      return;
    }
    this.viewDocumento(documento);
  }

  // ========== DRAG & DROP (CDK) ==========

  onDragStarted(item: any) {
    this.isDragging = true;
    this.hoverFolderId = null;
    this.isOverRoot = false;

    // Si hay selección múltiple y el item está seleccionado -> arrastramos grupo
    if (this.selectedDocuments.length > 0 && this.isSelected(item)) {
      this.draggedItems = [...this.selectedDocuments];
    } else {
      this.draggedItems = [item];
    }

    this.dragPreviewVisible = true;
    this.dragEndedRecently = false;
  }

  onDragMoved(event: CdkDragMove<any>) {
    const { x, y } = event.pointerPosition;
    // Mover el badge flotante un poco desfasado del cursor
    this.dragPreviewPosition = { x: x + 18, y: y + 18 };

    this.hoverFolderId = null;
    this.isOverRoot = false;

    // Detectar carpeta debajo del cursor
    const element = document.elementFromPoint(x, y) as HTMLElement | null;
    if (element) {
      const folderCard = element.closest('.documento-card.is-folder') as HTMLElement | null;
      if (folderCard) {
        const idAttr = folderCard.getAttribute('data-id');
        if (idAttr) {
          const idNum = Number(idAttr);
          if (!isNaN(idNum)) {
            this.hoverFolderId = idNum;
          }
        }
      }
    }

    // Detectar si está sobre la zona raíz
    if (this.rootDropZone && this.rootDropZone.nativeElement) {
      const rect = this.rootDropZone.nativeElement.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        this.isOverRoot = true;
        this.hoverFolderId = null;
      }
    }
  }

  onDragEnded(event: CdkDragEnd<any>) {
    this.isDragging = false;
    this.dragPreviewVisible = false;
    this.dragEndedRecently = true;

    const itemsToMove = [...this.draggedItems];

    // El elemento visual vuelve a su sitio original (CDK)
    event.source.reset();

    // Determinar destino
    const targetFolderId = this.hoverFolderId;
    const moveToRootZone = this.isOverRoot;

    // Limpiar estados de hover
    this.hoverFolderId = null;
    this.isOverRoot = false;
    this.draggedItems = [];

    // Pequeño timeout para que el drop no dispare click
    setTimeout(() => {
      this.dragEndedRecently = false;
    }, 150);

    // Si no hay elementos, no hacemos nada
    if (!itemsToMove.length) {
      return;
    }

    // Drop sobre carpeta
    if (targetFolderId !== null) {
      const targetFolder = this.DOCUMENTOS.find(
        d => d.id === targetFolderId && d.type === 'folder'
      );
      if (targetFolder) {
        this.moveDocumentsGroup(itemsToMove, targetFolder.id);
      }
      return;
    }

    // Drop en zona raíz (nivel actual / raíz)
    if (moveToRootZone) {
      // Siempre mover a raíz real
      this.moveDocumentsGroup(itemsToMove, null);
    }

  }

  /**
   * Mover grupo de documentos/carpeta a nueva ubicación
   */
  moveDocumentsGroup(items: any[], targetParentId: number | null) {
    if (!items || items.length === 0) return;

    const requests = items.map(item => {
      const data = { parent_id: targetParentId };
      return this.viewDocumentoService.moveDocument(item.id, data);
    });

    forkJoin(requests).subscribe({
      next: () => {
        // Eliminar del listado actual
        items.forEach(item => {
          const INDEX = this.DOCUMENTOS.findIndex((d: any) => d.id === item.id);
          if (INDEX !== -1) {
            this.DOCUMENTOS.splice(INDEX, 1);
          }
        });

        // Eliminar de la selección
        const ids = items.map(i => i.id);
        this.selectedDocuments = this.selectedDocuments.filter(d => !ids.includes(d.id));

        const msg = items.length === 1
          ? `"${items[0].name}" El cambio fue exitoso`
          : `${items.length} elementos han sido movidos exitosamente`;

        Swal.fire({
          icon: 'success',
          title: 'Movido',
          text: msg,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error moving documents:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message_text || 'Error al mover los elementos'
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
