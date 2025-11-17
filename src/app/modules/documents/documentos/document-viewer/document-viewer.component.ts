import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../../vista-documentos/service/vista-documento.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';

declare var DocsAPI: any; // OnlyOffice API

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss']
})
export class DocumentViewerComponent implements OnInit {
  
  @Input() DOCUMENTO_SELECTED: any;
  
  documentInfo: any = null;
  isLoading: boolean = true;
  viewerType: string = 'unknown'; // 'pdf', 'image', 'office', 'unknown'
  
  // Para PDFs e imágenes
  safeUrl: SafeResourceUrl | null = null;
  
  // Para OnlyOffice
  docEditor: any = null;
  onlyOfficeConfig: any = null;

  constructor(
    public modal: NgbActiveModal,
    private vistaDocumentoService: VistaDocumentoService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadDocumentInfo();
  }

  /**
   * Cargar información del documento
   */
  loadDocumentInfo() {
    this.isLoading = true;
    
    this.vistaDocumentoService.getDocumentInfo(this.DOCUMENTO_SELECTED.id).subscribe({
      next: (resp: any) => {
        this.documentInfo = resp;
        this.determineViewerType();
        this.initializeViewer();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading document info:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del documento'
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Determinar qué tipo de visor usar
   */
  determineViewerType() {
    const docType = this.documentInfo.document_type;
    
    if (docType === 'pdf') {
      this.viewerType = 'pdf';
    } else if (docType === 'image') {
      this.viewerType = 'image';
    } else if (['text', 'spreadsheet', 'presentation'].includes(docType)) {
      this.viewerType = 'office';
    } else {
      this.viewerType = 'unknown';
    }
  }

  /**
   * Inicializar el visor apropiado
   */
  initializeViewer() {
    switch (this.viewerType) {
      case 'pdf':
      case 'image':
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.documentInfo.url);
        break;
        
      case 'office':
        this.initializeOnlyOffice();
        break;
        
      case 'unknown':
        Swal.fire({
          icon: 'warning',
          title: 'Formato no soportado',
          text: 'Este tipo de archivo no puede visualizarse. Puedes descargarlo.',
          showCancelButton: true,
          confirmButtonText: 'Descargar',
          cancelButtonText: 'Cerrar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.downloadDocument();
          }
        });
        break;
    }
  }

  /**
   * Inicializar OnlyOffice Document Editor
   */
  initializeOnlyOffice() {
    // Verificar que OnlyOffice esté cargado
    if (typeof DocsAPI === 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'OnlyOffice no está disponible. Intenta descargar el archivo.',
        showCancelButton: true,
        confirmButtonText: 'Descargar',
        cancelButtonText: 'Cerrar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.downloadDocument();
        }
      });
      return;
    }

    // Configuración de OnlyOffice
    this.onlyOfficeConfig = {
      document: {
        fileType: this.getFileExtension(this.documentInfo.name),
        key: this.generateDocumentKey(),
        title: this.documentInfo.name,
        url: this.documentInfo.url,
        permissions: {
          edit: this.documentInfo.can_edit,
          download: true,
          print: true,
          review: true,
          comment: true
        }
      },
      documentType: this.documentInfo.document_type,
      editorConfig: {
        mode: this.documentInfo.can_edit ? 'edit' : 'view',
        lang: 'es',
        callbackUrl: this.getCallbackUrl(),
        user: {
          id: this.documentInfo.user?.id?.toString() || '1',
          name: this.documentInfo.user?.name || 'Usuario'
        },
        customization: {
          autosave: true,
          forcesave: false,
          comments: true,
          compactHeader: false,
          compactToolbar: false,
          help: true,
          hideRightMenu: false,
          showReviewChanges: true,
          zoom: 100
        }
      },
      width: '100%',
      height: '600px',
      events: {
        onDocumentReady: this.onDocumentReady.bind(this),
        onError: this.onDocumentError.bind(this),
        onWarning: this.onDocumentWarning.bind(this),
        onRequestSaveAs: this.onRequestSaveAs.bind(this)
      }
    };

    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.docEditor = new DocsAPI.DocEditor('onlyoffice-editor', this.onlyOfficeConfig);
    }, 100);
  }

  /**
   * Eventos de OnlyOffice
   */
  onDocumentReady() {
    console.log('Documento listo para editar');
  }

  onDocumentError(event: any) {
    console.error('Error en documento:', event);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un error al cargar el documento'
    });
  }

  onDocumentWarning(event: any) {
    console.warn('Advertencia en documento:', event);
  }

  onRequestSaveAs(event: any) {
    console.log('Guardar como:', event);
  }

  /**
   * Obtener extensión del archivo
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Generar clave única para el documento
   */
  generateDocumentKey(): string {
    // Combinar ID + timestamp para crear una clave única
    const timestamp = new Date(this.documentInfo.created_at).getTime();
    return `${this.documentInfo.id}-${timestamp}`;
  }

  /**
   * Obtener URL de callback para OnlyOffice
   */
  getCallbackUrl(): string {
    // URL donde OnlyOffice enviará los cambios guardados
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/documentos/${this.documentInfo.id}/save-callback`;
  }

  /**
   * Descargar documento
   */
  downloadDocument() {
    this.vistaDocumentoService.downloadDocument(this.DOCUMENTO_SELECTED.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.DOCUMENTO_SELECTED.name;
        link.click();
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
          icon: 'success',
          title: 'Descarga iniciada',
          text: `${this.DOCUMENTO_SELECTED.name}`,
          timer: 2000,
          showConfirmButton: false
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
   * Cerrar modal
   */
  closeModal() {
    // Destruir editor de OnlyOffice si existe
    if (this.docEditor) {
      this.docEditor.destroyEditor();
      this.docEditor = null;
    }
    
    this.modal.dismiss();
  }

  ngOnDestroy() {
    // Limpiar editor al destruir componente
    if (this.docEditor) {
      this.docEditor.destroyEditor();
    }
  }
}