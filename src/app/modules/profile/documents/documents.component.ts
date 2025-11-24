import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit {
  
  documentos: any[] = [];
  carpetas: any[] = [];
  archivos: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔵 DocumentsComponent - Inicializando');
    this.loadDocumentos();
  }

  /**
   * Cargar los documentos del usuario
   */
  loadDocumentos(): void {
    console.log('📁 Iniciando carga de documentos...');
    this.isLoading = true;
    this.cdr.detectChanges(); // Forzar detección de cambios
    
    this.profileService.getUserDocumentos(this.searchTerm).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        if (response.message === 200) {
          this.documentos = response.documentos || [];
          this.carpetas = response.carpetas || [];
          this.archivos = response.archivos || [];
          console.log('📁 Documentos:', this.documentos.length);
          console.log('📁 Carpetas:', this.carpetas.length);
          console.log('📁 Archivos:', this.archivos.length);
        } else {
          console.warn('⚠️ Respuesta sin documentos válidos');
          this.documentos = [];
          this.carpetas = [];
          this.archivos = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios después de actualizar
        console.log('✅ Estado de carga actualizado a false');
      },
      error: (error) => {
        console.error('❌ Error al cargar documentos:', error);
        this.documentos = [];
        this.carpetas = [];
        this.archivos = [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios en caso de error
      }
    });
  }

  /**
   * Buscar documentos
   */
  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    console.log('🔍 Buscando:', this.searchTerm);
    this.loadDocumentos();
  }

  /**
   * Descargar archivo
   */
  downloadFile(documento: any): void {
    console.log('⬇️ Descargando archivo:', documento.name);
    if (documento.file_url) {
      window.open(documento.file_url, '_blank');
    } else {
      console.error('❌ No hay URL para descargar');
    }
  }

  /**
   * Ver archivo en nueva pestaña
   */
  viewFile(documento: any): void {
    console.log('👁️ Ver archivo:', documento.name);
    if (documento.file_url) {
      window.open(documento.file_url, '_blank');
    } else {
      console.error('❌ No hay URL para ver');
    }
  }

  /**
   * Obtener el icono apropiado para el documento
   */
  getDocumentIcon(documento: any): string {
    if (documento.icon) {
      return documento.icon;
    }
    
    if (documento.type === 'folder') {
      return './assets/media/svg/files/folder-document.svg';
    }
    
    return './assets/media/svg/files/blank.svg';
  }
}