import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from 'src/app/modules/documents/vista-documentos/service/vista-documento.service';

// ================================================================
// INTERFACES PÚBLICAS
// Importadas por list-tickets y create-tickets
// ================================================================

/** Archivo nuevo — se subirá al servidor */
export interface AdjuntoNuevo {
  tipo: 'nuevo';
  file: File;
  guardarEnSistema: boolean;
  carpetaDestino: number | null;
}

/** Referencia a un documento existente en el sistema de archivos */
export interface AdjuntoExistente {
  tipo: 'existente';
  documento_id: number;
  nombre: string;
  mime_type: string;
  tamanio: number;
  file_url: string;
}

/** Enlace externo */
export interface AdjuntoUrl {
  tipo: 'url';
  titulo: string;
  url: string;
}

export type AdjuntoTicket = AdjuntoNuevo | AdjuntoExistente | AdjuntoUrl;

// ── Tipos internos ────────────────────────────────────────────────
type TabActiva = 'nuevo' | 'existente' | 'url';

interface ArchivoNuevoItem {
  file: File;
  guardarEnSistema: boolean;
  carpetaDestino: number | null;
  mostrandoSelectorCarpeta: boolean;
}

interface BreadcrumbItem { id: number | null; name: string; }
// ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-modal-adjuntos-tickets',
  templateUrl: './modal-adjuntos-tickets.component.html',
  styleUrls: ['./modal-adjuntos-tickets.component.scss'],
})
export class ModalAdjuntosTicketsComponent implements OnInit {

  /**
   * ID de la sucursal del ticket activo.
   * Filtra el explorador de archivos existentes por sucursal.
   * null → muestra todos los documentos.
   */
  @Input() sucursaleId: number | null = null;

  /** Emite la lista confirmada al padre */
  @Output() AdjuntosSeleccionados = new EventEmitter<AdjuntoTicket[]>();

  tabActiva: TabActiva = 'nuevo';

  // ── Tab 1 ─────────────────────────────────────────────────────
  archivosNuevos: ArchivoNuevoItem[] = [];
  isDragging = false;
  carpetasArbol: any[] = [];
  loadingCarpetas = false;

  // ── Tab 2 ─────────────────────────────────────────────────────
  breadcrumb: BreadcrumbItem[] = [{ id: null, name: 'Raíz' }];
  contenidoCarpeta: any[] = [];
  loadingExplorador = false;
  errorExplorador: string | null = null;
  seleccionados: AdjuntoExistente[] = [];

  // ── Tab 3 ─────────────────────────────────────────────────────
  urlTitulo = '';
  urlDireccion = '';
  urlsAgregadas: AdjuntoUrl[] = [];

  constructor(
    public modal: NgbActiveModal,
    private vistaDocService: VistaDocumentoService,
  ) {}

  ngOnInit(): void {
    this.cargarContenidoRaiz();
  }

  // ================================================================
  // CAMBIO DE PESTAÑA
  // ================================================================

  cambiarTab(tab: TabActiva): void {
    this.tabActiva = tab;
  }

  // ================================================================
  // TAB 1 — NUEVO ARCHIVO
  // ================================================================

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.agregarArchivos(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }
  onDragLeave(): void { this.isDragging = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    this.agregarArchivos(Array.from(e.dataTransfer?.files ?? []));
  }

  private agregarArchivos(files: File[]): void {
    files.forEach(f => this.archivosNuevos.push({
      file: f,
      guardarEnSistema: false,
      carpetaDestino: null,
      mostrandoSelectorCarpeta: false,
    }));
  }

  eliminarArchivoNuevo(i: number): void {
    this.archivosNuevos.splice(i, 1);
  }

  onToggleGuardarEnSistema(item: ArchivoNuevoItem): void {
    item.mostrandoSelectorCarpeta = item.guardarEnSistema;
    if (item.guardarEnSistema && this.carpetasArbol.length === 0 && this.sucursaleId) {
      this.cargarArbolCarpetas();
    }
  }

  private cargarArbolCarpetas(): void {
    if (!this.sucursaleId) return;
    this.loadingCarpetas = true;
    this.vistaDocService.getFolderTree(this.sucursaleId).subscribe({
      next: (resp: any) => {
        this.carpetasArbol = resp.folders ?? [];
        this.loadingCarpetas = false;
      },
      error: () => { this.loadingCarpetas = false; },
    });
  }

  seleccionarCarpeta(item: ArchivoNuevoItem, id: number | null): void {
    item.carpetaDestino = id;
    item.mostrandoSelectorCarpeta = false;
  }

  getNombreCarpeta(id: number | null): string {
    if (id === null) return 'Raíz';
    return this.buscarNombre(this.carpetasArbol, id) ?? 'Carpeta seleccionada';
  }

  private buscarNombre(nodos: any[], id: number): string | null {
    for (const n of nodos) {
      if (n.id === id) return n.name;
      if (n.children?.length) {
        const found = this.buscarNombre(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // ================================================================
  // TAB 2 — ARCHIVO EXISTENTE (explorador)
  // ================================================================

  private cargarContenidoRaiz(): void {
    this.loadingExplorador = true;
    this.errorExplorador = null;
    this.vistaDocService
      .listViewDocumentos(1, '', this.sucursaleId ?? undefined, null)
      .subscribe({
        next: (resp: any) => {
          this.contenidoCarpeta = resp.documentos ?? [];
          this.loadingExplorador = false;
        },
        error: () => {
          this.errorExplorador = 'No se pudo cargar el sistema de archivos.';
          this.loadingExplorador = false;
        },
      });
  }

  abrirCarpeta(carpeta: any): void {
    if (carpeta.type !== 'folder') return;
    this.breadcrumb.push({ id: carpeta.id, name: carpeta.name });
    this.loadingExplorador = true;
    this.vistaDocService.getFolderContents(carpeta.id).subscribe({
      next: (resp: any) => {
        this.contenidoCarpeta = resp.contents ?? [];
        this.loadingExplorador = false;
      },
      error: () => { this.loadingExplorador = false; },
    });
  }

  navegarBreadcrumb(index: number): void {
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    const item = this.breadcrumb[index];
    this.loadingExplorador = true;
    if (item.id === null) {
      this.cargarContenidoRaiz();
    } else {
      this.vistaDocService.getFolderContents(item.id).subscribe({
        next: (resp: any) => {
          this.contenidoCarpeta = resp.contents ?? [];
          this.loadingExplorador = false;
        },
        error: () => { this.loadingExplorador = false; },
      });
    }
  }

  volverAtras(): void {
    if (this.breadcrumb.length > 1) {
      this.breadcrumb.pop();
      this.navegarBreadcrumb(this.breadcrumb.length - 1);
    }
  }

  estaSeleccionado(doc: any): boolean {
    return this.seleccionados.some(s => s.documento_id === doc.id);
  }

  toggleSeleccion(doc: any): void {
    if (doc.type === 'folder') { this.abrirCarpeta(doc); return; }
    if (this.estaSeleccionado(doc)) {
      this.seleccionados = this.seleccionados.filter(s => s.documento_id !== doc.id);
    } else {
      this.seleccionados.push({
        tipo: 'existente',
        documento_id: doc.id,
        nombre: doc.name,
        mime_type: doc.mime_type ?? '',
        tamanio: parseInt(doc.size) || 0,
        file_url: doc.file_url ?? '',
      });
    }
  }

  quitarExistente(i: number): void { this.seleccionados.splice(i, 1); }

  // ================================================================
  // TAB 3 — URL
  // ================================================================

  get urlValida(): boolean {
    try { new URL(this.urlDireccion); return true; } catch { return false; }
  }

  agregarUrl(): void {
    if (!this.urlDireccion.trim() || !this.urlValida) return;
    this.urlsAgregadas.push({
      tipo: 'url',
      titulo: this.urlTitulo.trim() || this.urlDireccion.trim(),
      url: this.urlDireccion.trim(),
    });
    this.urlTitulo = '';
    this.urlDireccion = '';
  }

  quitarUrl(i: number): void { this.urlsAgregadas.splice(i, 1); }

  // ================================================================
  // CONFIRMAR — emite al padre y cierra
  // ================================================================

  get totalAdjuntos(): number {
    return this.archivosNuevos.length + this.seleccionados.length + this.urlsAgregadas.length;
  }

  confirmar(): void {
    const resultado: AdjuntoTicket[] = [
      ...this.archivosNuevos.map(a => ({
        tipo: 'nuevo' as const,
        file: a.file,
        guardarEnSistema: a.guardarEnSistema,
        carpetaDestino: a.carpetaDestino,
      })),
      ...this.seleccionados,
      ...this.urlsAgregadas,
    ];
    this.AdjuntosSeleccionados.emit(resultado);
    this.modal.close();
  }

  // ================================================================
  // HELPERS VISUALES
  // ================================================================

  getFileIcon(doc: any): string {
    if (doc.type === 'folder') return 'ki-duotone ki-folder text-warning';
    const m = (doc.mime_type ?? '').toLowerCase();
    if (m.includes('pdf'))                              return 'ki-duotone ki-file-pdf text-danger';
    if (m.includes('image'))                            return 'ki-duotone ki-file-jpg text-success';
    if (m.includes('word'))                             return 'ki-duotone ki-file-word text-primary';
    if (m.includes('excel') || m.includes('sheet'))    return 'ki-duotone ki-file-excel text-success';
    if (m.includes('powerpoint') || m.includes('ppt')) return 'ki-duotone ki-file-powerpoint text-warning';
    return 'ki-duotone ki-file text-gray-500';
  }

  formatSize(bytes: number): string {
    if (!bytes) return '—';
    const k = 1024;
    const s = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  }
}