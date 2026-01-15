import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class CronogramaProformasService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  // ========== MÉTODOS PARA CALENDARIO DE EVENTOS ==========
  
  // Listar todos los eventos del calendario
  listCalendarEvents() {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/calendar-events";
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Crear un nuevo evento
  createCalendarEvent(data: any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/calendar-events";
    return this.http.post(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Obtener un evento específico
  showCalendarEvent(eventId: string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/calendar-events/"+eventId;
    return this.http.get(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Actualizar un evento
  updateCalendarEvent(eventId: string, data: any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/calendar-events/"+eventId;
    return this.http.put(URL, data, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // Eliminar un evento
  deleteCalendarEvent(eventId: string) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/calendar-events/"+eventId;
    return this.http.delete(URL, {headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ========== MÉTODOS ANTERIORES DE PROFORMAS ==========

  cronograma(data:any) {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization':'Bearer '+this.authservice.token});
    let URL = URL_SERVICIOS+"/proformas/cronograma";
    return this.http.post(URL,data,{headers: headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  configAll(){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/config";
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  showProforma(PROFORMA_ID:string){
    this.isLoadingSubject.next(true);
    let URL = URL_SERVICIOS+"/proformas/"+PROFORMA_ID;
    let headers = new HttpHeaders({'Authorization': 'Bearer '+this.authservice.token});
    return this.http.get(URL,{headers:headers}).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  
}