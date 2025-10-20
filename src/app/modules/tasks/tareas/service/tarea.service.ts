import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, tap, catchError } from 'rxjs';
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

  registerTarea(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/tareas";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  

  listListas(grupo_id?: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    
    let URL = URL_SERVICIOS + "/listas";
    if (grupo_id) {
      URL += `?grupo_id=${grupo_id}`;
    }
    
    console.log('URL de petición listas:', URL);
    
    return this.http.get(URL, { headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  listTareas(page = 1,search:string = ''){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/tareas?page="+page+"&search="+search;
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  configAll(){
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/tareas/config";
    return this.http.get(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
  updateTarea(ID_TAREA:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/tareas/"+ID_TAREA;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteTarea(ID_TAREA:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/tareas/"+ID_TAREA;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteLista(ID_LISTA:string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/listas/"+ID_LISTA;
    return this.http.delete(URL,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

 

  registerLista(data: any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/listas";
    
    console.log('Registrando lista con datos:', data);
    
    return this.http.post(URL, data, { headers: headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateLista(ID_LISTA:string,data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS+"/listas/"+ID_LISTA;
    return this.http.put(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  moveTarea(tareaId: number, listaId: number) {
      console.log('🔄 Moviendo tarea:', { tareaId, listaId });
      
      let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
      let URL = URL_SERVICIOS + `/tareas/${tareaId}/move`;
      
      // ✅ POST (no PUT)
      return this.http.post(URL, { lista_id: listaId }, { headers }).pipe(
        tap((response: any) => {
          console.log('✅ Respuesta del servidor:', response);
        }),
        catchError((error) => {
          console.error('❌ Error al mover tarea:', error);
          console.error('Status:', error.status);
          console.error('Error completo:', error.error);
          throw error;
        })
      );
  }

  
  // 💬 Obtener timeline (comentarios y actividades)
  getTimeline(tareaId: number) {
    console.log('🌐 ===== INICIO getTimeline SERVICE =====');
    console.log('🌐 Tarea ID:', tareaId);
    
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/tareas/${tareaId}/timeline`;
    
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
        throw error;
      })
    );
  }

  // ➕ Agregar comentario
  addComment(tareaId: number, content: string) {
    console.log('💬 ===== INICIO addComment SERVICE =====');
    console.log('💬 Tarea ID:', tareaId);
    console.log('💬 Content:', content);
    
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/tareas/${tareaId}/comentarios`;
    
    console.log('💬 URL:', URL);
    
    return this.http.post(URL, { content }, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ ===== RESPUESTA addComment SERVICE =====');
        console.log('✅ Response:', response);
      }),
      catchError((error) => {
        console.error('❌ ===== ERROR addComment SERVICE =====');
        console.error('❌ Error completo:', error);
        throw error;
      }),
      finalize(() => {
        console.log('🏁 addComment finalizado');
        this.isLoadingSubject.next(false);
      })
    );
  }

  // ✏️ Actualizar comentario
  updateComment(tareaId: number, comentarioId: number, content: string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/tareas/${tareaId}/comentarios/${comentarioId}`;
    return this.http.put(URL, { content }, { headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // 🗑️ Eliminar comentario
  deleteComment(tareaId: number, comentarioId: number) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + `/tareas/${tareaId}/comentarios/${comentarioId}`;
    return this.http.delete(URL, { headers }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }


  // ✅ Agregar método para reordenar listas
  reorderListas(listas: { id: number, orden: number }[]) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authservice.token});
    let URL = URL_SERVICIOS + "/listas/reorder";
    
    console.log('📦 Enviando orden de listas:', listas);
    
    return this.http.post(URL, { listas }, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Orden guardado:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al guardar orden:', error);
        throw error;
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  

}
