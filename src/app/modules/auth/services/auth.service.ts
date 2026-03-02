import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Observable, BehaviorSubject, of, Subscription, interval } from 'rxjs';
import { map, catchError, switchMap, finalize } from 'rxjs/operators';
import { UserModel } from '../models/user.model';
import { AuthModel } from '../models/auth.model';
import { AuthHTTPService } from './auth-http';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';

export type UserType = UserModel | undefined;

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private unsubscribe: Subscription[] = [];
  private authLocalStorageToken = `${environment.appVersion}-${environment.USERDATA_KEY}`;

  // ⏱️ Intervalo en ms para revisar si el token expiró (cada 60 segundos)
  private readonly TOKEN_CHECK_INTERVAL = 60_000;
  // ⚠️ Tiempo en ms antes de la expiración para mostrar advertencia (5 minutos)
  private readonly WARN_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

  // public fields
  currentUser$: Observable<UserType>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserType>;
  isLoadingSubject: BehaviorSubject<boolean>;

  // Observable para mostrar advertencia de sesión próxima a expirar
  sessionExpiringSoon$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  get currentUserValue(): UserType {
    return this.currentUserSubject.value;
  }

  set currentUserValue(user: UserType) {
    this.currentUserSubject.next(user);
  }

  token: any;
  user: any;

  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router,
    private http: HttpClient,
    private ngZone: NgZone,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserType>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();

    const subscr = this.getUserByToken().subscribe();
    this.unsubscribe.push(subscr);

    // ✅ SOLUCIÓN 1 & 3: Iniciar verificación periódica del token
    this.startTokenExpirationCheck();

    // ✅ SOLUCIÓN 3: Escuchar cambios en localStorage de otras pestañas
    this.listenToStorageEvents();
  }

  // ─────────────────────────────────────────────
  // ✅ SOLUCIÓN 1: Verificación periódica del token
  // Cada 60 segundos revisa si el token expiró y redirige al login
  // ─────────────────────────────────────────────
  private startTokenExpirationCheck(): void {
    // ngZone.runOutsideAngular evita que el intervalo active change detection constantemente
    this.ngZone.runOutsideAngular(() => {
      const checkInterval = interval(this.TOKEN_CHECK_INTERVAL).subscribe(() => {
        this.ngZone.run(() => {
          this.checkTokenExpiration();
        });
      });
      this.unsubscribe.push(checkInterval);
    });
  }

  /**
   * Verifica si el token actual ha expirado.
   * Si expiró → logout automático con mensaje.
   * Si está próximo a expirar → emite advertencia.
   */
  checkTokenExpiration(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // convertir a ms
      const now = Date.now();
      const timeLeft = expiration - now;

      if (timeLeft <= 0) {
        // ❌ Token expirado → logout automático
        console.warn('[AuthService] Token expirado. Cerrando sesión...');
        this.logoutWithExpiredMessage();
      } else if (timeLeft <= this.WARN_BEFORE_EXPIRY_MS) {
        // ⚠️ Quedan menos de 5 minutos → emitir advertencia
        this.sessionExpiringSoon$.next(true);
      } else {
        this.sessionExpiringSoon$.next(false);
      }
    } catch (e) {
      // Token malformado → logout por seguridad
      this.logout();
    }
  }

  /**
   * Logout especial cuando la sesión expiró por tiempo.
   * Redirige al login con un query param para mostrar mensaje.
   */
  private logoutWithExpiredMessage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // ✅ Notificar a otras pestañas que la sesión cerró
    localStorage.setItem('logout_event', Date.now().toString());
    // Limpiamos el item inmediatamente (el evento storage ya se disparó)
    setTimeout(() => localStorage.removeItem('logout_event'), 100);

    this.currentUserSubject.next(undefined);
    this.sessionExpiringSoon$.next(false);

    this.router.navigate(['/auth/login'], {
      queryParams: { sessionExpired: true },
    });
  }

  // ─────────────────────────────────────────────
  // ✅ SOLUCIÓN 3: Sincronización entre pestañas
  // Escucha eventos del localStorage para detectar logout en otras pestañas
  // ─────────────────────────────────────────────
  private listenToStorageEvents(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      this.ngZone.run(() => {
        // Detectar logout desde otra pestaña
        if (event.key === 'logout_event' && event.newValue) {
          console.info('[AuthService] Sesión cerrada en otra pestaña. Redirigiendo...');
          this.currentUserSubject.next(undefined);
          this.router.navigate(['/auth/login'], {
            queryParams: { sessionClosed: true },
          });
        }

        // Detectar nuevo login desde otra pestaña (opcional: recargar para sincronizar)
        if (event.key === 'token' && event.newValue) {
          console.info('[AuthService] Nueva sesión detectada en otra pestaña.');
          // Recargar el usuario desde localStorage actualizado
          const subscr = this.getUserByToken().subscribe();
          this.unsubscribe.push(subscr);
        }

        // Detectar que borraron el token (por ejemplo limpieza manual)
        if (event.key === 'token' && !event.newValue) {
          this.currentUserSubject.next(undefined);
          this.router.navigate(['/auth/login']);
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // Métodos públicos existentes (sin cambios en lógica)
  // ─────────────────────────────────────────────

  login(email: string, password: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http.post(URL_SERVICIOS + '/auth/login', { email, password }).pipe(
      map((auth: any) => {
        const result = this.setAuthFromLocalStorage(auth);
        // ✅ Verificar expiración apenas iniciamos sesión
        if (result) {
          this.sessionExpiringSoon$.next(false);
        }
        return result;
      }),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // ✅ SOLUCIÓN 3: Notificar a otras pestañas del logout
    localStorage.setItem('logout_event', Date.now().toString());
    setTimeout(() => localStorage.removeItem('logout_event'), 100);

    this.currentUserSubject.next(undefined);
    this.sessionExpiringSoon$.next(false);

    this.router.navigate(['/auth/login'], {
      queryParams: {},
    });
  }

  getUserByToken(): Observable<any> {
    const auth = this.getAuthFromLocalStorage();
    if (!auth) {
      return of(undefined);
    }

    // ✅ Verificar si el token ya expiró al cargar
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000;
        if (Date.now() >= expiration) {
          // Token expirado al cargar la app
          this.logoutWithExpiredMessage();
          return of(undefined);
        }
      } catch (e) {
        this.logout();
        return of(undefined);
      }
    }

    this.isLoadingSubject.next(true);
    return of(auth).pipe(
      map((user: any) => {
        if (user) {
          this.currentUserSubject.next(user);
        } else {
          this.logout();
        }
        return user;
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  registration(user: UserModel): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.createUser(user).pipe(
      map(() => {
        this.isLoadingSubject.next(false);
      }),
      switchMap(() => this.login(user.email, user.password)),
      catchError((err) => {
        console.error('err', err);
        return of(undefined);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  private setAuthFromLocalStorage(auth: any): boolean {
    if (auth && auth.access_token) {
      localStorage.setItem('token', auth.access_token);
      localStorage.setItem('user', JSON.stringify(auth.user));
      return true;
    }
    return false;
  }

  private getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const lsValue = localStorage.getItem('user');
      if (!lsValue) {
        return undefined;
      }
      this.token = localStorage.getItem('token');
      this.user = JSON.parse(lsValue);
      const authData = this.user;
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    // Limpiar el event listener del storage
    window.removeEventListener('storage', () => {});
  }
}