import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../service/vista-documento.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-view-vista-documento',
  templateUrl: './view-vista-documento.component.html',
  styleUrls: ['./view-vista-documento.component.scss']
})
export class ViewVistaDocumentoComponent implements OnInit, OnDestroy {
  @Input() DOCUMENTO_SELECTED: any;

  blobUrl: SafeUrl | null = null;
  isLoading = true;
  hasError = false;

  // Referencia a la object URL para liberarla al destruir el componente
  private objectUrl: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private vistaDocumentoService: VistaDocumentoService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.DOCUMENTO_SELECTED?.type === 'file') {
      this.loadFile();
    } else {
      // Si por alguna razón no es file, salir del loading
      this.isLoading = false;
    }
  }

  /**
   * Solicitar el archivo al backend como Blob y crear una URL local temporal.
   * De esta forma el navegador nunca hace una petición directa al storage,
   * evitando problemas de CORS y de symlinks rotos en producción.
   */
  loadFile(): void {
    this.isLoading = true;
    this.hasError = false;

    // Revocar URL anterior si existe (p.ej. al reintentar)
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
      this.blobUrl = null;
    }

    this.vistaDocumentoService.serveDocument(this.DOCUMENTO_SELECTED.id).subscribe({
      next: (blob: Blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        // bypassSecurityTrustResourceUrl es necesario porque Angular bloquea
        // por defecto las URLs blob: en [src] e iframes
        this.blobUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error cargando archivo:', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  /**
   * Disparar descarga del archivo usando la URL blob ya cargada.
   * Si aún no está cargada, hace la petición y descarga al completar.
   */
  downloadFile(): void {
    if (this.objectUrl) {
      this._triggerDownload(this.objectUrl);
      return;
    }

    // Si no hay blob todavía, pedirlo y descargar
    this.vistaDocumentoService.serveDocument(this.DOCUMENTO_SELECTED.id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        this._triggerDownload(url);
        // Revocar después de un pequeño delay para que el browser lo procese
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: (err: any) => console.error('Error al descargar:', err)
    });
  }

  private _triggerDownload(url: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = this.DOCUMENTO_SELECTED.name;
    a.click();
  }

  ngOnDestroy(): void {
    // Liberar memoria del navegador al cerrar el modal
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}