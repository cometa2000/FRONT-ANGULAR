import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ProfileService } from '../service/profile.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
})
export class DocumentsComponent implements OnInit, OnDestroy {
  
  documentos: any[] = [];
  carpetas: any[] = [];
  archivos: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  hasError: boolean = false;
  errorMessage: string = '';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private profileService: ProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔵 DocumentsComponent - Inicializando');
    console.log('📊 Estado inicial - documentos:', this.documentos.length);
    this.loadDocumentos();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscription.unsubscribe();
  }

  /**
   * Cargar los documentos del usuario
   */
  loadDocumentos(forceRefresh: boolean = false): void {
    console.log('📁 Iniciando carga de documentos... (search:', this.searchTerm, 'forceRefresh:', forceRefresh, ')');
    this.isLoading = true;
    this.hasError = false;
    // ✅ Limpiar arrays antes de cargar
    this.documentos = [];
    this.carpetas = [];
    this.archivos = [];
    this.cdr.detectChanges();
    
    const sub = this.profileService.getUserDocumentos(this.searchTerm, forceRefresh).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa recibida:', response);
        console.log('📁 Tipo de respuesta:', typeof response);
        console.log('📁 Keys de respuesta:', Object.keys(response));
        
        // ✅ Validación más robusta
        if (response && response.message === 200) {
          // Documentos
          if (response.documentos && Array.isArray(response.documentos)) {
            this.documentos = response.documentos;
            console.log('✅ Documentos asignados:', this.documentos.length);
          } else {
            console.warn('⚠️ response.documentos no es un array válido:', response.documentos);
            this.documentos = [];
          }
          
          // Carpetas
          if (response.carpetas && Array.isArray(response.carpetas)) {
            this.carpetas = response.carpetas;
            console.log('✅ Carpetas asignadas:', this.carpetas.length);
          } else {
            console.warn('⚠️ response.carpetas no es un array válido:', response.carpetas);
            this.carpetas = [];
          }
          
          // Archivos
          if (response.archivos && Array.isArray(response.archivos)) {
            this.archivos = response.archivos;
            console.log('✅ Archivos asignados:', this.archivos.length);
          } else {
            console.warn('⚠️ response.archivos no es un array válido:', response.archivos);
            this.archivos = [];
          }
          
          console.log('📁 Primera carpeta (si existe):', this.carpetas[0]);
          console.log('📁 Primer archivo (si existe):', this.archivos[0]);
        } else {
          console.warn('⚠️ Respuesta con message !== 200:', response.message);
          this.documentos = [];
          this.carpetas = [];
          this.archivos = [];
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('✅ Estado final - documentos:', this.documentos.length, 
                    'carpetas:', this.carpetas.length, 
                    'archivos:', this.archivos.length, 
                    'isLoading:', this.isLoading);
      },
      error: (error) => {
        console.error('❌ Error al cargar documentos:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error completo:', JSON.stringify(error));
        
        this.documentos = [];
        this.carpetas = [];
        this.archivos = [];
        this.isLoading = false;
        this.hasError = true;
        
        // Mensaje de error específico
        if (error.status === 401) {
          this.errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.errorMessage = 'No se encontró el endpoint. Verifica el backend.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Revisa los logs de Laravel.';
        } else {
          this.errorMessage = 'No se pudieron cargar los documentos.';
        }
        
        this.cdr.detectChanges();
      }
    });
    
    this.subscription.add(sub);
  }

  /**
   * Refrescar documentos manualmente
   */
  refreshDocumentos(): void {
    console.log('🔄 Refrescando documentos (invalidando caché)...');
    this.profileService.invalidateCache();
    this.loadDocumentos(true);
  }

  /**
   * Buscar documentos
   */
  onSearch(event: any): void {
    const newSearchTerm = event.target.value;
    console.log('🔍 Búsqueda cambiada de:', this.searchTerm, 'a:', newSearchTerm);
    this.searchTerm = newSearchTerm;
    
    // Invalidar caché porque es una búsqueda nueva
    this.profileService.invalidateCache();
    this.loadDocumentos(true);
  }

  /**
   * Descargar archivo
   */
  downloadFile(documento: any): void {
    console.log('⬇️ Descargando archivo:', documento);
    
    if (documento.file_url) {
      console.log('📁 URL del archivo:', documento.file_url);
      window.open(documento.file_url, '_blank');
    } else {
      console.error('❌ No hay URL para descargar');
      console.error('❌ Documento completo:', documento);
      alert('No se pudo encontrar la URL del archivo');
    }
  }

  /**
   * Ver archivo en nueva pestaña
   */
  viewFile(documento: any): void {
    console.log('👁️ Ver archivo:', documento);
    
    if (documento.file_url) {
      console.log('📁 URL del archivo:', documento.file_url);
      window.open(documento.file_url, '_blank');
    } else {
      console.error('❌ No hay URL para ver');
      console.error('❌ Documento completo:', documento);
      alert('No se pudo encontrar la URL del archivo');
    }
  }

  /**
   * Obtener el icono apropiado para el documento
   */
  getDocumentIcon(documento: any): string {
    if (!documento) {
      console.warn('⚠️ getDocumentIcon recibió documento null/undefined');
      return './assets/media/svg/files/blank.svg';
    }
    
    if (documento.icon) {
      return documento.icon;
    }
    
    if (documento.type === 'folder') {
      return './assets/media/svg/files/folder-document.svg';
    }
    
    return './assets/media/svg/files/blank.svg';
  }
}