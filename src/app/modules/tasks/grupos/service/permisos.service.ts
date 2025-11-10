import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GrupoPermission {
  grupoId: number;
  permissionType: 'all' | 'readonly' | 'custom';
  permissionLevel: 'owner' | 'read' | 'write';
  isOwner: boolean;
  hasWriteAccess: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private currentPermissionsSubject = new BehaviorSubject<GrupoPermission | null>(null);
  public currentPermissions$ = this.currentPermissionsSubject.asObservable();

  constructor() {}

  setCurrentPermissions(permissions: GrupoPermission) {
    this.currentPermissionsSubject.next(permissions);
  }

  getCurrentPermissions(): GrupoPermission | null {
    return this.currentPermissionsSubject.value;
  }

  canWrite(grupo?: any): boolean {
    if (grupo) {
      return grupo.is_owner || grupo.has_write_access;
    }
    const current = this.getCurrentPermissions();
    return current ? current.hasWriteAccess : false;
  }

  isReadOnly(grupo?: any): boolean {
    if (grupo) {
      if (grupo.is_owner) return false;
      if (grupo.permission_type === 'readonly') return true;
      if (grupo.permission_type === 'custom') {
        return grupo.permission_level === 'read';
      }
      return false;
    }
    const current = this.getCurrentPermissions();
    if (!current) return false;
    return !current.hasWriteAccess && !current.isOwner;
  }

  isOwner(grupo?: any): boolean {
    if (grupo) {
      return grupo.is_owner === true;
    }
    const current = this.getCurrentPermissions();
    return current ? current.isOwner : false;
  }

  canShowActionButtons(grupo?: any): boolean {
    return this.canWrite(grupo);
  }

  canDrag(grupo?: any): boolean {
    return this.canWrite(grupo);
  }

  getPermissionLabel(grupo: any): string {
    if (grupo.is_owner) return 'Propietario';
    if (grupo.permission_type === 'readonly') return 'Solo lectura';
    if (grupo.permission_type === 'all') return 'Permisos completos';
    if (grupo.permission_level === 'read') return 'Solo lectura';
    if (grupo.permission_level === 'write') return 'Lectura y escritura';
    return 'Sin acceso';
  }

  getPermissionBadgeClass(grupo: any): string {
    if (grupo.is_owner) return 'bg-success';
    if (this.canWrite(grupo)) return 'bg-primary';
    if (this.isReadOnly(grupo)) return 'bg-warning';
    return 'bg-secondary';
  }

  clearPermissions() {
    this.currentPermissionsSubject.next(null);
  }
}