import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../../vista-documentos/service/vista-documento.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-documento',
  templateUrl: './create-documento.component.html',
  styleUrls: ['./create-documento.component.scss']
})
export class CreateDocumentoComponent implements OnInit {
  @Output() DocumentosCreated: EventEmitter<any[]> = new EventEmitter();
  
  @Input() sucursales: any[] = [];
  @Input() currentUser: any = null;
  @Input() isAdmin: boolean = false;
  @Input() parent_id: number | null = null;
  @Input() sucursale_id: number | null = null;

  // Sucursales seleccionadas
  selectedSucursaleIds: number[] = [];
  allSucursalesSelected: boolean = false;

  // Archivos seleccionados
  selectedFiles: File[] = [];
  
  // Carpetas disponibles y carpeta seleccionada
  availableFolders: any[] = [];
  selectedFolderId: number | null = null;

  // UI states
  isDragOver: boolean = false;
  isLoading: boolean = false;

  // Descripción opcional
  description: string = '';

  constructor(
    public modal: NgbActiveModal,
    public vistaDocumentoService: VistaDocumentoService,
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Inicializar componente
   */
  private initializeComponent() {
    // Si viene con sucursal predefinida (desde vista-documento)
    if (this.sucursale_id) {
      this.selectedSucursaleIds = [this.sucursale_id];
      this.loadFolderTree();
      
      if (this.parent_id) {
        this.selectedFolderId = this.parent_id;
      }
    } else if (!this.isAdmin && this.currentUser) {
      // Usuario normal: usar su sucursal
      this.selectedSucursaleIds = [this.currentUser.sucursale_id];
      this.loadFolderTree();
    }
  }

  /**
   * Cargar árbol de carpetas para la sucursal actual
   */
  loadFolderTree() {
    if (this.selectedSucursaleIds.length !== 1) {
      this.availableFolders = [];
      return;
    }

    const sucursalId = this.selectedSucursaleIds[0];
    
    this.vistaDocumentoService.getFolderTree(sucursalId).subscribe({
      next: (resp: any) => {
        this.availableFolders = this.flattenFolderTree(resp.folders || [], 0);
      },
      error: (err) => {
        console.error('Error loading folder tree:', err);
        this.availableFolders = [];
      }
    });
  }

  /**
   * Aplanar árbol de carpetas para mostrar en select
   */
  private flattenFolderTree(folders: any[], level: number): any[] {
    let result: any[] = [];
    
    folders.forEach(folder => {
      result.push({
        id: folder.id,
        name: folder.name,
        level: level,
        children: folder.children || []
      });
      
      if (folder.children && folder.children.length > 0) {
        result = result.concat(this.flattenFolderTree(folder.children, level + 1));
      }
    });
    
    return result;
  }

  /**
   * Obtener indentación visual para carpetas
   */
  getFolderIndentation(level: number): string {
    return '—'.repeat(level) + ' ';
  }

  // ========== SELECCIÓN DE SUCURSALES ==========

  /**
   * Toggle selección de todas las sucursales
   */
  toggleAllSucursales(event: any) {
    const checked = event.target.checked;
    
    if (checked) {
      this.selectedSucursaleIds = this.sucursales.map(s => s.id);
      this.allSucursalesSelected = true;
    } else {
      this.selectedSucursaleIds = [];
      this.allSucursalesSelected = false;
    }

    this.onSucursalSelectionChange();
  }

  /**
   * Toggle sucursal individual
   */
  toggleSucursal(sucursalId: number, event: any) {
    const checked = event.target.checked;
    
    if (checked) {
      if (!this.selectedSucursaleIds.includes(sucursalId)) {
        this.selectedSucursaleIds.push(sucursalId);
      }
    } else {
      this.selectedSucursaleIds = this.selectedSucursaleIds.filter(id => id !== sucursalId);
    }

    this.allSucursalesSelected = this.selectedSucursaleIds.length === this.sucursales.length;
    this.onSucursalSelectionChange();
  }

  /**
   * Verificar si sucursal está seleccionada
   */
  isSucursalSelected(sucursalId: number): boolean {
    return this.selectedSucursaleIds.includes(sucursalId);
  }

  /**
   * Cuando cambia la selección de sucursales
   */
  private onSucursalSelectionChange() {
    // Si hay más de una sucursal, limpiar carpeta seleccionada
    if (this.selectedSucursaleIds.length > 1) {
      this.selectedFolderId = null;
      this.availableFolders = [];
    } else if (this.selectedSucursaleIds.length === 1) {
      this.loadFolderTree();
    }
  }

  /**
   * Obtener nombre de la sucursal del usuario
   */
  getUserSucursalName(): string {
    if (!this.currentUser) return 'Sin sucursal';
    
    const sucursal = this.sucursales.find(s => s.id === this.currentUser.sucursale_id);
    return sucursal ? sucursal.name : 'Sin sucursal';
  }

  /**
   * Verificar si se puede seleccionar carpeta
   */
  canSelectFolder(): boolean {
    return this.selectedSucursaleIds.length === 1;
  }

  // ========== MANEJO DE ARCHIVOS ==========

  /**
   * Drag over handler
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  /**
   * Drag leave handler
   */
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  /**
   * Drop handler
   */
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  }

  /**
   * Procesar archivos del input
   */
  processFiles(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
    
    // Limpiar input para permitir seleccionar los mismos archivos de nuevo
    event.target.value = '';
  }

  /**
   * Agregar archivos a la lista
   */
  private addFiles(files: File[]) {
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      const isValid = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);
      
      if (isValid && file.size <= 20971520) { // 20MB
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (validFiles.length > 0) {
      this.selectedFiles.push(...validFiles);
    }

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivos no válidos',
        html: `Los siguientes archivos no son válidos o exceden el tamaño máximo (20MB):<br><br>${invalidFiles.join('<br>')}`,
        confirmButtonText: 'Entendido'
      });
    }
  }

  /**
   * Eliminar un archivo de la lista
   */
  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Limpiar todos los archivos
   */
  clearAllFiles() {
    Swal.fire({
      icon: 'question',
      title: '¿Limpiar archivos?',
      text: 'Se eliminarán todos los archivos seleccionados',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedFiles = [];
      }
    });
  }

  /**
   * Obtener tamaño total de archivos
   */
  getTotalSize(): string {
    const total = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return this.formatFileSize(total);
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtener ícono según tipo de archivo
   */
  getFileIcon(file: File): string {
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'ki-duotone ki-file-pdf fs-2x';
    if (type.includes('image')) return 'ki-duotone ki-file-jpg fs-2x';
    if (type.includes('word') || type.includes('document')) return 'ki-duotone ki-file-word fs-2x';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'ki-duotone ki-file-excel fs-2x';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'ki-duotone ki-file-powerpoint fs-2x';
    if (type.includes('text')) return 'ki-duotone ki-file-text fs-2x';
    
    return 'ki-duotone ki-file fs-2x';
  }

  /**
   * Obtener clase de color para el ícono
   */
  getFileIconClass(file: File): string {
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'bg-light-danger';
    if (type.includes('image')) return 'bg-light-success';
    if (type.includes('word')) return 'bg-light-primary';
    if (type.includes('excel')) return 'bg-light-success';
    if (type.includes('powerpoint')) return 'bg-light-warning';
    if (type.includes('text')) return 'bg-light-info';
    
    return 'bg-light-secondary';
  }

  // ========== VALIDACIÓN Y SUBIDA ==========

  /**
   * Verificar si se puede subir
   */
  canUpload(): boolean {
    return this.selectedSucursaleIds.length > 0 && this.selectedFiles.length > 0;
  }

  /**
   * Subir archivo(s)
   */
  upload() {
    if (!this.canUpload()) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Debes seleccionar al menos una sucursal y un archivo',
      });
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    
    // Agregar sucursales
    this.selectedSucursaleIds.forEach((id, index) => {
      formData.append(`sucursale_ids[${index}]`, id.toString());
    });

    // Agregar archivos
    this.selectedFiles.forEach((file, index) => {
      formData.append(`files[${index}]`, file, file.name);
    });

    // Agregar carpeta padre (si aplica)
    if (this.canSelectFolder() && this.selectedFolderId) {
      formData.append('parent_id', this.selectedFolderId.toString());
    }

    // Agregar descripción
    if (this.description.trim()) {
      formData.append('description', this.description.trim());
    }

    this.vistaDocumentoService.uploadFile(formData).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          const count = resp.documentos?.length || 1;
          const sucursalesCount = this.selectedSucursaleIds.length;
          
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: `${count} documento(s) subido(s) a ${sucursalesCount} sucursal(es)`,
            timer: 2500,
            showConfirmButton: false
          });
          
          this.DocumentosCreated.emit(resp.documentos || []);
          this.modal.close();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.message_text || 'Error al subir archivo(s)'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error uploading files:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message_text || 'Error al subir archivo(s)'
        });
        this.isLoading = false;
      }
    });
  }
}