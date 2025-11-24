import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit, OnDestroy {
  
  currentUser: any = null;
  isLoading: boolean = false;
  
  private unsubscribe: Subscription[] = [];

  constructor(
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  /**
   * Cargar los datos del usuario
   */
  loadUserData(): void {
    // Suscribirse al observable del usuario actual
    const userSub = this.profileService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
        }
      }
    });
    
    this.unsubscribe.push(userSub);
  }

  /**
   * Formatear el género del usuario
   */
  getGenderLabel(gender: string): string {
    if (!gender) return 'No especificado';
    
    const genderMap: any = {
      'M': 'Masculino',
      'F': 'Femenino',
      'Otro': 'Otro'
    };
    
    return genderMap[gender] || gender;
  }

  /**
   * Formatear el tipo de documento
   */
  getDocumentLabel(): string {
    if (!this.currentUser?.type_document || !this.currentUser?.n_document) {
      return 'No especificado';
    }
    
    return `${this.currentUser.type_document}: ${this.currentUser.n_document}`;
  }

  /**
   * Obtener el nombre del rol
   */
  getRoleName(): string {
    if (this.currentUser?.role) {
      return this.currentUser.role.name;
    }
    return 'Sin rol asignado';
  }

  /**
   * Obtener el nombre de la sucursal
   */
  getSucursalName(): string {
    if (this.currentUser?.sucursal) {
      return this.currentUser.sucursal.name;
    }
    return 'Sin sucursal asignada';
  }

  /**
   * Formatear la fecha de creación
   */
  getCreatedDate(): string {
    if (this.currentUser?.created_format_at) {
      return this.currentUser.created_format_at;
    }
    return 'No disponible';
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}