import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProfileService } from './service/profile.service';
import { AuthService } from '../auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  
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
  isLoading: boolean = false;

  constructor(
    public authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🔵 ProfileComponent - Inicializando');
    this.loadUserData();
    this.loadUserStats();
    this.redirectToDefaultTab();
  }

  /**
   * Redirigir automáticamente a la tab de proyectos si no hay ruta hija
   */
  redirectToDefaultTab(): void {
    // Verificar si estamos exactamente en la ruta /profile sin subrutas
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
    console.log('👤 Usuario cargado:', this.user);
  }

  /**
   * Cargar estadísticas del usuario
   */
  loadUserStats(): void {
    console.log('📊 Cargando estadísticas...');
    this.isLoading = true;
    
    this.profileService.getUserStats().subscribe({
      next: (response) => {
        console.log('✅ Estadísticas recibidas:', response);
        if (response.message === 200 && response.stats) {
          this.stats = response.stats;
          console.log('📊 Stats actualizados:', this.stats);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.isLoading = false;
      }
    });
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