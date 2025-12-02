import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { PermisosPersonalizadosModalComponent } from '../permisos-personalizados-modal/permisos-personalizados-modal.component';

import Swal from 'sweetalert2';
@Component({
  selector: 'app-permisos-grupo-modal',
  templateUrl: './permisos-grupo-modal.component.html',
  styleUrls: ['./permisos-grupo-modal.component.scss']
})
export class PermisosGrupoModalComponent implements OnInit {
  @Input() GRUPO_SELECTED: any;
  @Output() PermisosChanged: EventEmitter<any> = new EventEmitter();

  permissionType: string = 'all';
  isLoading: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private grupoService: GrupoService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.GRUPO_SELECTED) {
      this.loadPermissions();
    }
  }

  loadPermissions() {
    this.isLoading = true;
    this.grupoService.getPermissions(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.permissionType = resp.permissions.permission_type;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.toast.error('Error al cargar permisos');
        this.isLoading = false;
      }
    });
  }

  selectPermissionType(type: string) {
    this.permissionType = type;
  }

  savePermissions() {
    // Si selecciona 'custom', abrir el modal de permisos personalizados
    if (this.permissionType === 'custom') {
      this.modal.close();
      this.openCustomPermissionsModal();
      return;
    }

    this.isLoading = true;

    this.grupoService.updatePermissionType(this.GRUPO_SELECTED.id, this.permissionType).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Permisos actualizados',
            text: 'Los permisos se actualizaron correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.PermisosChanged.emit(resp.grupo);
          this.modal.close();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al actualizar permisos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar permisos',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        this.isLoading = false;
      }
    });
  }


  openCustomPermissionsModal() {
    const modalRef = this.modalService.open(PermisosPersonalizadosModalComponent, {
      centered: true,
      size: 'lg'
    });
    modalRef.componentInstance.GRUPO_SELECTED = this.GRUPO_SELECTED;
    modalRef.componentInstance.PermisosChanged.subscribe((grupo: any) => {
      this.PermisosChanged.emit(grupo);
    });
  }

  
}