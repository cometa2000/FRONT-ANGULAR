import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, shareReplay, finalize } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  // ✅ CACHÉ de datos
  private statsCache$: Observable<any> | null = null;
  private tareasCache$: Observable<any> | null = null;
  private documentosCache: Map<string, Observable<any>> = new Map();
  
  // ✅ Control de caché
  private statsCacheTime: number = 0;
  private tareasCacheTime: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // ⭐ NUEVO: BehaviorSubject para sincronización de avatar
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser$: Observable<any>;

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    console.log('🔧 ProfileService (Profile) inicializado');
    
    // ⭐ Inicializar BehaviorSubject con el usuario actual
    this.currentUserSubject = new BehaviorSubject<any>(this.authservice.user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

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
  // ✅ VERIFICAR SI EL CACHÉ ES VÁLIDO
  // =============================
  private isCacheValid(cacheTime: number): boolean {
    const isValid = Date.now() - cacheTime < this.CACHE_DURATION;
    console.log('🔍 Verificando caché:', { 
      cacheTime, 
      now: Date.now(), 
      diff: Date.now() - cacheTime,
      isValid 
    });
    return isValid;
  }

  // =============================
  // ✅ INVALIDAR CACHÉ
  // =============================
  invalidateCache(): void {
    console.log('🗑️ Invalidando caché del perfil');
    this.statsCache$ = null;
    this.tareasCache$ = null;
    this.documentosCache.clear();
    this.statsCacheTime = 0;
    this.tareasCacheTime = 0;
  }

  // =============================
  // ✅ OBTENER TAREAS DEL USUARIO (CON CACHÉ OPCIONAL)
  // =============================
  getUserTareas(forceRefresh: boolean = false): Observable<any> {
    console.log('🌐 ProfileService.getUserTareas', { forceRefresh });
    
    // Si el caché es válido y no se fuerza el refresh, devolver caché
    if (!forceRefresh && this.tareasCache$ && this.isCacheValid(this.tareasCacheTime)) {
      console.log('📦 Devolviendo tareas desde caché');
      return this.tareasCache$;
    }
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/tareas`;
    
    console.log('📄 Realizando petición HTTP para tareas:', URL);
    console.log('🔑 Token:', this.authservice.token?.substring(0, 20) + '...');
    
    // ✅ shareReplay mantiene el observable vivo y comparte el resultado
    this.tareasCache$ = this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Tareas del usuario obtenidas:', response);
        console.log('📊 Número de tareas:', response.tareas?.length || 0);
        this.tareasCacheTime = Date.now();
      }),
      catchError((error) => {
        console.error('❌ Error al obtener tareas del usuario:', error);
        console.error('📋 Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.tareasCache$ = null; // Limpiar caché en caso de error
        return throwError(() => error);
      }),
      shareReplay(1) // Comparte el último resultado entre múltiples suscriptores
    );

    return this.tareasCache$;
  }

  // =============================
  // ✅ OBTENER DOCUMENTOS DEL USUARIO (CON CACHÉ POR BÚSQUEDA)
  // =============================
  getUserDocumentos(search: string = '', forceRefresh: boolean = false): Observable<any> {
    console.log('🌐 ProfileService.getUserDocumentos', { search, forceRefresh });
    
    const cacheKey = `documentos_${search}`;
    
    // Si el caché es válido y no se fuerza el refresh, devolver caché
    if (!forceRefresh && this.documentosCache.has(cacheKey)) {
      console.log('📦 Devolviendo documentos desde caché');
      return this.documentosCache.get(cacheKey)!;
    }
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/documentos?search=${search}`;
    
    console.log('📄 Realizando petición HTTP para documentos:', URL);
    
    const request$ = this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Documentos del usuario obtenidos:', response);
        console.log('📊 Número de documentos:', response.documentos?.length || 0);
        console.log('📁 Carpetas:', response.carpetas?.length || 0);
        console.log('📄 Archivos:', response.archivos?.length || 0);
      }),
      catchError((error) => {
        console.error('❌ Error al obtener documentos del usuario:', error);
        console.error('📋 Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.documentosCache.delete(cacheKey); // Limpiar caché en caso de error
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    this.documentosCache.set(cacheKey, request$);
    return request$;
  }

  // =============================
  // ✅ OBTENER ESTADÍSTICAS DEL PERFIL (CON CACHÉ)
  // =============================
  getUserStats(forceRefresh: boolean = false): Observable<any> {
    console.log('🌐 ProfileService.getUserStats', { forceRefresh });
    
    // Si el caché es válido y no se fuerza el refresh, devolver caché
    if (!forceRefresh && this.statsCache$ && this.isCacheValid(this.statsCacheTime)) {
      console.log('📦 Devolviendo estadísticas desde caché');
      return this.statsCache$;
    }
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/stats`;
    
    console.log('📄 Realizando petición HTTP para estadísticas:', URL);
    
    this.statsCache$ = this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Estadísticas del usuario obtenidas:', response);
        console.log('📊 Stats:', response.stats);
        this.statsCacheTime = Date.now();
      }),
      catchError((error) => {
        console.error('❌ Error al obtener estadísticas del usuario:', error);
        console.error('📋 Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.statsCache$ = null; // Limpiar caché en caso de error
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    return this.statsCache$;
  }

  // =============================
  // 🚀 NUEVO: OBTENER PERFIL COMPLETO EN UNA SOLA LLAMADA
  // =============================
  getCompleteProfile(
    options: {
      loadTareas?: boolean,
      loadDocumentos?: boolean,
      loadStats?: boolean
    } = {}
  ): Observable<any> {
    console.log('🌐 ProfileService.getCompleteProfile', options);
    
    const {
      loadTareas = true,
      loadDocumentos = false,
      loadStats = true
    } = options;
    
    const headers = this.getHeaders();
    const URL = `${URL_SERVICIOS}/profile/complete?tareas=${loadTareas}&documentos=${loadDocumentos}&stats=${loadStats}`;
    
    console.log('📄 Realizando petición HTTP para perfil completo:', URL);
    
    return this.http.get(URL, { headers }).pipe(
      tap((response: any) => {
        console.log('✅ Perfil completo obtenido:', response);
      }),
      catchError((error) => {
        console.error('❌ Error al obtener perfil completo:', error);
        return throwError(() => error);
      })
    );
  }

  // =============================
  // ✅ MÉTODO HELPER PARA PRE-CARGAR DATOS
  // =============================
  preloadProfileData(): void {
    console.log('⏰ Pre-cargando datos del perfil');
    
    // Pre-cargar stats y tareas en paralelo
    this.getUserStats().subscribe({
      next: () => console.log('✅ Stats pre-cargados'),
      error: (err) => console.error('❌ Error pre-cargando stats:', err)
    });
    
    this.getUserTareas().subscribe({
      next: () => console.log('✅ Tareas pre-cargadas'),
      error: (err) => console.error('❌ Error pre-cargando tareas:', err)
    });
  }

  // =============================
  // ⭐ NUEVO: MÉTODOS PARA SINCRONIZACIÓN DE USUARIO
  // =============================

  /**
   * ⭐ Actualizar el usuario en el BehaviorSubject Y en AuthService
   */
  setCurrentUser(user: any): void {
    console.log('💾 Actualizando usuario en ProfileService (Profile):', user);
    
    // Actualizar en el BehaviorSubject
    this.currentUserSubject.next(user);
    
    // ✅ CRÍTICO: También actualizar en el AuthService
    this.authservice.user = user;
    
    // ✅ También actualizar el currentUserSubject del AuthService si existe
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
}