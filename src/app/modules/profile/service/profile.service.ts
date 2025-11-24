import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, catchError, tap } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {}

  // =============================
  // MÉTODO PRIVADO PARA HEADERS
  // =============================
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // =============================
  // OBTENER TAREAS DEL USUARIO
  // =============================
  getUserTareas(): Observable<any> {
    console.log('🌐 ProfileService.getUserTareas - Obteniendo tareas del usuario');
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/tareas`;
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Tareas del usuario obtenidas:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al obtener tareas del usuario:', error);
        throw error;
      })
    );
  }

  // =============================
  // OBTENER DOCUMENTOS DEL USUARIO
  // =============================
  getUserDocumentos(search: string = ''): Observable<any> {
    console.log('🌐 ProfileService.getUserDocumentos - Obteniendo documentos del usuario');
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/documentos?search=${search}`;
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Documentos del usuario obtenidos:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al obtener documentos del usuario:', error);
        throw error;
      })
    );
  }

  // =============================
  // OBTENER ESTADÍSTICAS DEL PERFIL
  // =============================
  getUserStats(): Observable<any> {
    console.log('🌐 ProfileService.getUserStats - Obteniendo estadísticas del usuario');
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/stats`;
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Estadísticas del usuario obtenidas:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al obtener estadísticas del usuario:', error);
        throw error;
      })
    );
  }
}