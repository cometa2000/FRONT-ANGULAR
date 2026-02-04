import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class VistaDocumentoService {
  
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error('No se encontró token de autenticación');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Obtener headers para FormData (sin Content-Type)
   */
  private getHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  /**
   * Listar documentos (con filtros opcionales)
   */
  listViewDocumentos(page = 1, search: string = '', sucursale_id?: number, parent_id?: number | null) {
    this.isLoadingSubject.next(true);
    
    let params: any = {
      page: page.toString(),
      search: search
    };

    if (sucursale_id) {
      params.sucursale_id = sucursale_id.toString();
    }

    if (parent_id !== undefined) {
      params.parent_id = parent_id === null ? 'null' : parent_id.toString();
    }

    let URL = URL_SERVICIOS + "/documentos";
    
    return this.http.get(URL, { 
      params,
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Obtener estructura de árbol completa de una sucursal
   */
  getTree(sucursale_id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/documentos/tree";
    
    return this.http.get(URL, { 
      params: { sucursale_id: sucursale_id.toString() },
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Obtener árbol de carpetas (solo carpetas, para selección)
   */
  getFolderTree(sucursale_id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/documentos/folder-tree";
    
    return this.http.get(URL, { 
      params: { sucursale_id: sucursale_id.toString() },
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Obtener contenido de una carpeta específica
   */
  getFolderContents(folderId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/folder/${folderId}`;
    
    return this.http.get(URL, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Crear carpeta
   */
  createFolder(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/documentos/folder";
    
    return this.http.post(URL, data, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Subir archivo(s) - ahora soporta múltiples archivos y sucursales
   */
  uploadFile(data: FormData): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + "/documentos";
    
    return this.http.post(URL, data, {
      headers: this.getHeadersForFormData()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Mover documento/carpeta (drag and drop)
   */
  moveDocument(documentId: number, data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/${documentId}/move`;
    
    return this.http.post(URL, data, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Actualizar documento/carpeta
   */
  updateDocument(documentId: number, data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/${documentId}`;
    
    return this.http.put(URL, data, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Eliminar documento/carpeta
   */
  deleteDocument(documentId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/${documentId}`;
    
    return this.http.delete(URL, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Marcar documento como visto
   */
  markAsViewed(documentId: number): Observable<any> {
    let URL = URL_SERVICIOS + `/documentos/${documentId}/mark-viewed`;
    
    return this.http.post(URL, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener configuración (sucursales, roles, etc.)
   */
  getConfig(): Observable<any> {
    let URL = URL_SERVICIOS + "/documentos/config";
    
    return this.http.get(URL, {
      headers: this.getHeaders()
    });
  }

  /**
   * Descargar documento
   */
  downloadDocument(documentId: number): Observable<Blob> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/${documentId}/download`;
    
    return this.http.get(URL, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Obtener información del documento para el visor
   */
  getDocumentInfo(documentId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS + `/documentos/${documentId}/info`;
    
    return this.http.get(URL, {
      headers: this.getHeaders()
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
}