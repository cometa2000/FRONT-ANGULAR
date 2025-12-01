import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, finalize, tap } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  
  // BehaviorSubject para almacenar los datos del usuario actual
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser$: Observable<any>;
  
  private profileLoaded: boolean = false;
  
  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
    
    this.currentUserSubject = new BehaviorSubject<any>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    this.initializeProfile();
  }

  /**
   * ⭐ Inicializar el perfil automáticamente
   */
  private initializeProfile(): void {
    if (this.authservice.token && !this.profileLoaded) {
      this.getProfile().subscribe({
        next: (user) => {
          console.log('✅ Perfil inicializado automáticamente:', user);
          this.setCurrentUser(user);
          this.profileLoaded = true;
        },
        error: (error) => {
          console.error('❌ Error al inicializar perfil:', error);
          const fallbackUser = this.authservice.user;
          if (fallbackUser) {
            this.currentUserSubject.next(fallbackUser);
          }
        }
      });
    }
  }

  /**
   * Obtener los datos del usuario autenticado desde el servidor
   */
  getProfile(): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS + "/auth/me";
    
    console.log('📡 Solicitando perfil desde:', URL);
    
    return this.http.post(URL, {}, {headers: headers}).pipe(
      tap(response => {
        console.log('📥 Respuesta del servidor (getProfile):', response);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Actualizar el perfil del usuario autenticado
   */
  updateProfile(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    
    const userId = this.getCurrentUserValue()?.id || this.authservice.user?.id;
    
    if (!userId) {
      throw new Error('No se encontró el ID del usuario autenticado');
    }
    
    let URL = URL_SERVICIOS + "/users/" + userId;
    
    console.log('📡 Actualizando perfil en:', URL);
    
    return this.http.post(URL, data, {headers: headers}).pipe(
      tap(response => {
        console.log('📥 Respuesta del servidor (updateProfile):', response);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ⭐ ACTUALIZADO: Actualizar el usuario en el BehaviorSubject Y en AuthService
   */
  setCurrentUser(user: any): void {
    console.log('💾 Actualizando usuario en BehaviorSubject:', user);
    
    // Actualizar en el BehaviorSubject
    this.currentUserSubject.next(user);
    
    // ✅ CRÍTICO: También actualizar en el AuthService para que se refleje en toda la app
    this.authservice.user = user;
    
    // ✅ NUEVO: También actualizar el currentUserSubject del AuthService si existe
    if (this.authservice.currentUserSubject) {
      this.authservice.currentUserSubject.next(user);
    }
    
    console.log('✅ Usuario actualizado en ambos servicios');
  }

  /**
   * Obtener el usuario actual del BehaviorSubject
   */
  getCurrentUserValue(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener configuración (roles, sucursales, etc.)
   */
  getConfig(): Observable<any> {
    this.isLoadingSubject.next(true);
    let headers = new HttpHeaders({'Authorization': 'Bearer '+ this.authservice.token});
    let URL = URL_SERVICIOS + "/users/config";
    
    console.log('📡 Solicitando configuración desde:', URL);
    
    return this.http.get(URL, {headers: headers}).pipe(
      tap(response => {
        console.log('📥 Respuesta del servidor (getConfig):', response);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ⭐ Recargar el perfil desde el servidor
   */
  reloadProfile(): Observable<any> {
    return this.getProfile().pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }
}