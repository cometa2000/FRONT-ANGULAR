import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

export interface Enlace {
  id?: number;
  url: string;
  nombre: string;
}

export interface Archivo {
  id?: number;
  nombre: string;
  tipo: string;
  tiempo_subida: string;
  file?: File;
  preview?: string;
  file_url?: string;
}

@Component({
  selector: 'app-adjuntar-modal',
  templateUrl: './adjuntar-modal.component.html',
  styleUrls: ['./adjuntar-modal.component.scss']
})
export class AdjuntarModalComponent {
  @Output() adjuntoAgregado: EventEmitter<{ enlaces: Enlace[], archivos: Archivo[] }> = new EventEmitter();
  @Input() adjuntosExistentes?: { enlaces: Enlace[], archivos: Archivo[] };

  // Tabs
  activeTab: 'archivo' | 'enlace' = 'archivo';

  // Para archivos
  isDragOver: boolean = false;
  archivoSeleccionado: File | null = null;
  archivoPreview: string | null = null;

  // Para enlaces
  enlaceUrl: string = '';
  enlaceNombre: string = '';

  constructor(
    public modal: NgbActiveModal,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    // Inicializar si es necesario
  }

  // =============================
  // 📑 MANEJO DE TABS
  // =============================
  cambiarTab(tab: 'archivo' | 'enlace'): void {
    this.activeTab = tab;
  }

  // =============================
  // 📄 MANEJO DE ARCHIVOS
  // =============================
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.procesarArchivo({ target: { files: [file] } } as any);
    }
  }

  onFileSelected(event: any): void {
    this.procesarArchivo(event);
  }

  procesarArchivo(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validaciones de tipo
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowed) {
      this.toast.warning('El archivo no es válido', 'Tipo no permitido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      this.toast.warning('El archivo es muy grande', 'Máximo 10MB');
      return;
    }

    this.archivoSeleccionado = file;

    // Preview solo para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        this.archivoPreview = reader.result as string;
      };
    } else {
      this.archivoPreview = null;
    }
  }

  eliminarArchivo(): void {
    this.archivoSeleccionado = null;
    this.archivoPreview = null;
  }

  // =============================
  // 🔗 MANEJO DE ENLACES
  // =============================
  validarUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // =============================
  // 💾 GUARDAR ADJUNTO
  // =============================
  guardarAdjunto(): void {
    if (this.activeTab === 'archivo') {
      if (!this.archivoSeleccionado) {
        this.toast.warning('Selecciona un archivo', 'Validación');
        return;
      }

      const archivo: Archivo = {
        nombre: this.archivoSeleccionado.name,
        tipo: this.archivoSeleccionado.type,
        tiempo_subida: new Date().toISOString(),
        file: this.archivoSeleccionado,
        preview: this.archivoPreview || undefined
      };

      this.adjuntoAgregado.emit({
        enlaces: [],
        archivos: [archivo]
      });

      this.toast.success('Archivo adjuntado', 'Éxito');
      this.modal.close({ type: 'archivo', data: archivo });

    } else if (this.activeTab === 'enlace') {
      if (!this.enlaceUrl || !this.enlaceNombre) {
        this.toast.warning('Completa los campos del enlace', 'Validación');
        return;
      }

      if (!this.validarUrl(this.enlaceUrl)) {
        this.toast.warning('URL no válida', 'Validación');
        return;
      }

      const enlace: Enlace = {
        url: this.enlaceUrl,
        nombre: this.enlaceNombre
      };

      this.adjuntoAgregado.emit({
        enlaces: [enlace],
        archivos: []
      });

      this.toast.success('Enlace agregado', 'Éxito');
      this.modal.close({ type: 'enlace', data: enlace });
    }
  }

  // =============================
  // 🎨 OBTENER ICONO POR TIPO
  // =============================
  obtenerIcono(tipo: string): string {
    if (tipo.startsWith('image/')) return 'fa-file-image';
    if (tipo === 'application/pdf') return 'fa-file-pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'fa-file-excel';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'fa-file-powerpoint';
    return 'fa-file';
  }

  // =============================
  // 📏 FORMATEAR TAMAÑO
  // =============================
  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}