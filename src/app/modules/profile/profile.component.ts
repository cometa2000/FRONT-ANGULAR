import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ProfileService } from './service/profile.service';
import { AuthService } from '../auth';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit, OnDestroy {
  
  user: any = null;
  stats: any = {
    tareas: {
      total: 0,
      pendientes: 0,
      en_progreso: 0,
      completadas: 0
    },
    documentos: {
      total: 0,
      carpetas: 0,
      archivos: 0
    },
    success_rate: 0
  };
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  private routerSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔵 ProfileComponent - Inicializando');
    console.log('👤 Usuario actual:', this.authService.user);
    
    // ✅ IMPORTANTE: Invalidar caché al entrar al perfil
    // Esto asegura que siempre se carguen datos frescos
    this.profileService.invalidateCache();
    
    this.loadUserData();
    this.loadUserStats();
    this.redirectToDefaultTab();
    
    // ✅ Escuchar cambios de ruta para actualizar stats
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      console.log('🔄 Ruta cambiada:', event.url);
      // Recargar stats solo si volvemos a /profile desde otra ruta
      if (event.url.includes('/profile') && !event.url.includes('/profile/')) {
        this.loadUserStats();
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Redirigir automáticamente a la tab de proyectos si no hay ruta hija
   */
  redirectToDefaultTab(): void {
    const currentUrl = this.router.url;
    console.log('🔍 URL actual:', currentUrl);
    
    if (currentUrl === '/profile' || currentUrl === '/profile/') {
      console.log('↪️ Redirigiendo a /profile/projects');
      this.router.navigate(['./projects'], { relativeTo: this.route });
    }
  }

  /**
   * Cargar datos del usuario autenticado
   */
  loadUserData(): void {
    this.user = this.authService.user;
    console.log('👤 Usuario cargado:', {
      id: this.user?.id,
      name: this.user?.name,
      email: this.user?.email
    });
    
    if (!this.user) {
      console.warn('⚠️ No hay usuario autenticado');
      this.hasError = true;
      this.errorMessage = 'No se pudo cargar la información del usuario';
    }
    
    this.cdr.detectChanges();
  }

  /**
   * ✅ OPTIMIZADO: Cargar estadísticas con manejo de errores y detección de cambios
   */
  loadUserStats(): void {
    console.log('📊 Cargando estadísticas...');
    this.isLoading = true;
    this.hasError = false;
    
    this.cdr.detectChanges();
    
    // ✅ Forzar refresh sin usar caché
    this.profileService.getUserStats(true).subscribe({
      next: (response) => {
        console.log('✅ Estadísticas recibidas:', response);
        
        if (response.message === 200 && response.stats) {
          // ✅ Actualizar stats de forma explícita
          this.stats = {
            tareas: {
              total: response.stats.tareas?.total || 0,
              pendientes: response.stats.tareas?.pendientes || 0,
              en_progreso: response.stats.tareas?.en_progreso || 0,
              completadas: response.stats.tareas?.completadas || 0
            },
            documentos: {
              total: response.stats.documentos?.total || 0,
              carpetas: response.stats.documentos?.carpetas || 0,
              archivos: response.stats.documentos?.archivos || 0
            },
            success_rate: response.stats.success_rate || 0
          };
          
          console.log('📊 Stats actualizados:', this.stats);
        } else {
          console.warn('⚠️ Respuesta sin stats válidos:', response);
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('✅ Detección de cambios forzada');
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        console.error('📋 Detalles del error:', {
          status: error.status,
          message: error.message,
          statusText: error.statusText
        });
        
        this.hasError = true;
        
        // Mensajes de error específicos
        if (error.status === 401) {
          this.errorMessage = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error del servidor. Intenta más tarde.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = 'No se pudieron cargar las estadísticas.';
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * ✅ NUEVO: Método para recargar stats manualmente
   */
  reloadStats(): void {
    console.log('🔄 Recargando estadísticas manualmente...');
    this.profileService.invalidateCache();
    this.loadUserStats();
  }

  /**
   * Obtener el avatar del usuario
   */
  getUserAvatar(): string {
    if (this.user && this.user.avatar) {
      return this.user.avatar;
    }
    return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  }

  /**
   * Obtener el nombre completo del usuario
   */
  getUserFullName(): string {
    if (this.user) {
      return this.user.full_name || `${this.user.name || ''} ${this.user.surname || ''}`.trim();
    }
    return 'Usuario';
  }

  /**
   * Obtener el rol del usuario
   */
  getUserRole(): string {
    if (this.user && this.user.role_name) {
      return this.user.role_name;
    }
    return 'Usuario';
  }

  /**
   * Obtener la sucursal del usuario
   */
  getUserSucursal(): string {
    if (this.user && this.user.sucursale_name) {
      return this.user.sucursale_name;
    }
    return 'Sin sucursal';
  }

  /**
   * Obtener el email del usuario
   */
  getUserEmail(): string {
    if (this.user && this.user.email) {
      return this.user.email;
    }
    return '';
  }
}