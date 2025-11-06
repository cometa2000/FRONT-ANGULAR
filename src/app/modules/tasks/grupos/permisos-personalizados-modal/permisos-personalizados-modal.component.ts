import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-permisos-personalizados-modal',
  templateUrl: './permisos-personalizados-modal.component.html',
  styleUrls: ['./permisos-personalizados-modal.component.scss']
})
export class PermisosPersonalizadosModalComponent implements OnInit {
  @Input() GRUPO_SELECTED: any;
  @Output() PermisosChanged: EventEmitter<any> = new EventEmitter();

  users: any[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.GRUPO_SELECTED) {
      this.loadUsersWithPermissions();
    }
  }

  loadUsersWithPermissions() {
    this.isLoading = true;
    this.grupoService.getPermissions(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200 && resp.permissions.users) {
          this.users = resp.permissions.users;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.toast.error('Error al cargar usuarios');
        this.isLoading = false;
      }
    });
  }

  changePermission(user: any, permissionLevel: string) {
    user.permission_level = permissionLevel;
  }

  savePermissions() {
    this.isSaving = true;

    // Preparar datos para actualización en lote
    const usersToUpdate = this.users.map(user => ({
      user_id: user.id,
      permission_level: user.permission_level
    }));

    // Primero actualizar el tipo de permiso a 'custom'
    this.grupoService.updatePermissionType(this.GRUPO_SELECTED.id, 'custom').subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          // Luego actualizar los permisos de todos los usuarios
          this.grupoService.batchUpdateUserPermissions(this.GRUPO_SELECTED.id, usersToUpdate).subscribe({
            next: (batchResp: any) => {
              if (batchResp.message === 200) {
                this.toast.success('Permisos personalizados guardados correctamente');
                this.PermisosChanged.emit(this.GRUPO_SELECTED);
                this.modal.close();
              }
              this.isSaving = false;
            },
            error: (err) => {
              console.error('Error al guardar permisos:', err);
              this.toast.error('Error al guardar permisos');
              this.isSaving = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al actualizar tipo de permiso:', err);
        this.toast.error('Error al actualizar permisos');
        this.isSaving = false;
      }
    });
  }

  getInitials(name: string, surname: string): string {
    const firstInitial = name ? name.charAt(0).toUpperCase() : '';
    const lastInitial = surname ? surname.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }
}