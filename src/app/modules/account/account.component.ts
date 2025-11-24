import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from './service/profile.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit, OnDestroy {
  
  currentUser: any = null;
  isLoading: boolean = true; // ⭐ CAMBIADO: Empezar en true para mostrar loading
  
  private unsubscribe: Subscription[] = [];

  constructor(
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    console.log('🔄 AccountComponent inicializado');
    this.loadUserProfile();
  }

  /**
   * Cargar el perfil del usuario autenticado
   */
  loadUserProfile(): void {
    // ⭐ PRIMERO: Suscribirse a los cambios del usuario (tiempo real)
    const userSub = this.profileService.currentUser$.subscribe({
      next: (user) => {
        console.log('👤 Usuario actualizado en AccountComponent:', user);
        if (user) {
          this.currentUser = user;
          this.isLoading = false;
        }
      }
    });
    
    this.unsubscribe.push(userSub);

    // ⭐ SEGUNDO: Verificar si ya hay datos, si no, cargar desde servidor
    const currentValue = this.profileService.getCurrentUserValue();
    
    if (!currentValue || !currentValue.role || !currentValue.sucursal) {
      console.log('⚠️ Datos incompletos o no disponibles, cargando desde servidor...');
      
      const profileSub = this.profileService.getProfile().subscribe({
        next: (resp: any) => {
          console.log('✅ Perfil cargado correctamente:', resp);
          this.currentUser = resp;
          this.profileService.setCurrentUser(resp);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar el perfil:', error);
          this.isLoading = false;
        }
      });
      
      this.unsubscribe.push(profileSub);
    } else {
      console.log('✅ Usando datos existentes del servicio');
      this.currentUser = currentValue;
      this.isLoading = false;
    }
  }

  /**
   * Obtener la URL del avatar del usuario
   */
  getAvatarUrl(): string {
    if (this.currentUser?.avatar) {
      return this.currentUser.avatar;
    }
    return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  }

  /**
   * Obtener el nombre completo del usuario
   */
  getFullName(): string {
    if (this.currentUser) {
      return this.currentUser.full_name || `${this.currentUser.name || ''} ${this.currentUser.surname || ''}`.trim();
    }
    return 'Usuario';
  }

  /**
   * Obtener el rol del usuario
   */
  getUserRole(): string {
    console.log('🔍 Obteniendo rol del usuario:', this.currentUser?.role);
    
    if (this.currentUser?.role) {
      return this.currentUser.role.name || 'Sin rol';
    }
    
    // ⭐ NUEVO: Fallback a roles (Spatie)
    if (this.currentUser?.roles && this.currentUser.roles.length > 0) {
      return this.currentUser.roles[0].name || 'Sin rol';
    }
    
    return 'Sin rol';
  }

  /**
   * Obtener el email del usuario
   */
  getUserEmail(): string {
    return this.currentUser?.email || '';
  }

  /**
   * Obtener la sucursal del usuario
   */
  getUserSucursal(): string {
    console.log('🔍 Obteniendo sucursal del usuario:', this.currentUser?.sucursal);
    
    if (this.currentUser?.sucursal) {
      return this.currentUser.sucursal.name || 'Sin sucursal';
    }
    return 'Sin sucursal';
  }

  /**
   * Calcular el porcentaje de completitud del perfil
   */
  calculateProfileCompletion(): number {
    if (!this.currentUser) return 0;
    
    let completedFields = 0;
    const totalFields = 9; // Total de campos importantes
    
    // Campos obligatorios
    if (this.currentUser.name) completedFields++;
    if (this.currentUser.surname) completedFields++;
    if (this.currentUser.email) completedFields++;
    
    // Campos opcionales pero importantes
    if (this.currentUser.phone) completedFields++;
    if (this.currentUser.avatar) completedFields++;
    if (this.currentUser.role_id) completedFields++;
    if (this.currentUser.sucursale_id) completedFields++;
    if (this.currentUser.type_document && this.currentUser.n_document) completedFields++;
    if (this.currentUser.gender) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }

  ngOnDestroy(): void {
    console.log('🔚 AccountComponent destruido');
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}