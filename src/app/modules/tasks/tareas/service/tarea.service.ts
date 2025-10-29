import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, tap, catchError, throwError } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  // =============================
  // 🔧 MÉTODO PRIVADO PARA HEADERS
  // =============================
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // =============================
  // 🔧 MÉTODO PRIVADO PARA MANEJO DE ERRORES
  // =============================
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error HTTP:', error);
    
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor.';
      }
    }
    
    console.error('📄 Mensaje de error:', errorMessage);
    return throwError(() => ({ ...error, userMessage: errorMessage }));
  }

  // =============================
  // 📖 MÉTODO SHOW - VER TAREA
  // =============================
  show(tareaId: string): Observable<any> {
    console.log('🌐 TareaService.show - Iniciando petición para tarea:', tareaId);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}`;
    
    console.log('🌐 URL completa:', URL);
    console.log('🌐 Headers:', headers.keys());
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ TareaService.show - Respuesta exitosa:', response);
      }),
      catchError((error) => {
        console.error('❌ TareaService.show - Error en la petición:', error);
        return this.handleError(error);
      }),
      finalize(() => {
        console.log('🏁 TareaService.show - Petición finalizada');
        this.isLoadingSubject.next(false);
      })
    );
  }

  // =============================
  // 🔄 MÉTODO UPDATE - ACTUALIZAR TAREA
  // =============================
  update(tareaId: string, data: any): Observable<any> {
    console.log('🌐 TareaService.update - Actualizando tarea:', tareaId, data);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}`;
    
    return this.http.put(URL, data, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ TareaService.update - Actualización exitosa:', response);
      }),
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // ➕ MÉTODO REGISTER - CREAR TAREA
  // =============================
  registerTarea(data: any) {
    console.log('🌐 TareaService.registerTarea - Creando tarea:', data);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas`;
    
    return this.http.post(URL, data, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ TareaService.registerTarea - Tarea creada:', response);
      }),
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  // =============================
  // 📋 MÉTODO LIST LISTAS
  // =============================
  listListas(grupo_id?: number) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    
    let URL = `${URL_SERVICIOS}/listas`;
    if (grupo_id) {
      URL += `?grupo_id=${grupo_id}`;
    }
    
    console.log('🌐 URL de petición listas:', URL);
    
    return this.http.get(URL, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 📋 MÉTODO LIST TAREAS
  // =============================
  listTareas(page = 1, search: string = '') {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas?page=${page}&search=${search}`;
    
    return this.http.get(URL, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  // =============================
  // ⚙️ MÉTODO CONFIG
  // =============================
  configAll() {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/config`;
    
    return this.http.get(URL, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  // =============================
  // 🔄 MÉTODO UPDATE TAREA (Alternativo)
  // =============================
  updateTarea(ID_TAREA: string | number, data: any) {
    console.log('🌐 TareaService.updateTarea - Actualizando:', ID_TAREA, data);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${ID_TAREA}`;
    
    return this.http.put(URL, data, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ TareaService.updateTarea - Actualización exitosa:', response);
      }),
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🗑️ MÉTODO DELETE TAREA
  // =============================
  deleteTarea(ID_TAREA: string) {
    console.log('🌐 TareaService.deleteTarea - Eliminando:', ID_TAREA);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${ID_TAREA}`;
    
    return this.http.delete(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ TareaService.deleteTarea - Eliminación exitosa:', response);
      }),
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🗑️ MÉTODO DELETE LISTA
  // =============================
  deleteLista(ID_LISTA: string) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/listas/${ID_LISTA}`;
    
    return this.http.delete(URL, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // ➕ MÉTODO REGISTER LISTA
  // =============================
  registerLista(data: any) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/listas`;
    
    console.log('🌐 Registrando lista con datos:', data);
    
    return this.http.post(URL, data, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🔄 MÉTODO UPDATE LISTA
  // =============================
  updateLista(ID_LISTA: string, data: any) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/listas/${ID_LISTA}`;
    
    return this.http.put(URL, data, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🔀 MÉTODO MOVE TAREA
  // =============================
  moveTarea(tareaId: number, listaId: number) {
    console.log('🔄 Moviendo tarea:', { tareaId, listaId });
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}/move`;
    
    return this.http.post(URL, { lista_id: listaId }, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Respuesta del servidor:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al mover tarea:', error);
        console.error('Status:', error.status);
        console.error('Error completo:', error.error);
        return this.handleError(error);
      })
    );
  }

  // =============================
  // 💬 OBTENER TIMELINE
  // =============================
  getTimeline(tareaId: number) {
    console.log('🌐 ===== INICIO getTimeline SERVICE =====');
    console.log('🌐 Tarea ID:', tareaId);
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}/timeline`;
    
    console.log('🌐 URL completa:', URL);
    console.log('🌐 Headers:', headers.keys());
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ ===== RESPUESTA getTimeline SERVICE =====');
        console.log('✅ Response completo:', response);
        console.log('✅ Timeline length:', response.timeline?.length || 0);
        console.log('✅ Timeline items:', response.timeline);
      }),
      catchError((error) => {
        console.error('❌ ===== ERROR getTimeline SERVICE =====');
        console.error('❌ Status:', error.status);
        console.error('❌ Status Text:', error.statusText);
        console.error('❌ Error:', error.error);
        console.error('❌ Message:', error.message);
        console.error('❌ URL:', error.url);
        return this.handleError(error);
      })
    );
  }

  // =============================
  // ➕ AGREGAR COMENTARIO
  // =============================
  addComment(tareaId: number, content: string) {
    console.log('💬 ===== INICIO addComment SERVICE =====');
    console.log('💬 Tarea ID:', tareaId);
    console.log('💬 Content:', content);
    
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}/comentarios`;
    
    console.log('💬 URL:', URL);
    
    return this.http.post(URL, { content }, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ ===== RESPUESTA addComment SERVICE =====');
        console.log('✅ Response:', response);
      }),
      catchError((error) => {
        console.error('❌ ===== ERROR addComment SERVICE =====');
        console.error('❌ Error completo:', error);
        return this.handleError(error);
      }),
      finalize(() => {
        console.log('🏁 addComment finalizado');
        this.isLoadingSubject.next(false);
      })
    );
  }

  // =============================
  // ✏️ ACTUALIZAR COMENTARIO
  // =============================
  updateComment(tareaId: number, comentarioId: number, content: string) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}/comentarios/${comentarioId}`;
    
    return this.http.put(URL, { content }, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🗑️ ELIMINAR COMENTARIO
  // =============================
  deleteComment(tareaId: number, comentarioId: number) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/tareas/${tareaId}/comentarios/${comentarioId}`;
    
    return this.http.delete(URL, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // =============================
  // 🔀 REORDENAR LISTAS
  // =============================
  reorderListas(listas: { id: number, orden: number }[]) {
    this.isLoadingSubject.next(true);
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/listas/reorder`;
    
    console.log('📦 Enviando orden de listas:', listas);
    
    return this.http.post(URL, { listas }, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Orden guardado:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al guardar orden:', error);
        return this.handleError(error);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  
}