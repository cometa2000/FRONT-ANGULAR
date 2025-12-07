import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SIDEBAR } from 'src/app/config/config';
import { RolesService } from '../service/roles.service';
import { ToastrService } from 'ngx-toastr';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-roles',
  templateUrl: './create-roles.component.html',
  styleUrls: ['./create-roles.component.scss']
})
export class CreateRolesComponent {

  @Output() RoleC: EventEmitter<any> = new EventEmitter();
  name:string = '';

  isLoading:any;

  SIDEBAR:any = SIDEBAR;

  permisions:any = [];
  constructor(
    public modal: NgbActiveModal,
    public rolesService: RolesService,
    public toast: ToastrService,
  ) {}
  
  addPermission(permiso:string){
    let INDEX = this.permisions.findIndex((perm:string) => perm == permiso);
    if(INDEX != -1){
      this.permisions.splice(INDEX,1);
    } else {
      this.permisions.push(permiso);
    }
    console.log(this.permisions);
  }

  store() {
    if (!this.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      }).then(() => this.modal.close());  // 🔥 Cierra modal también en validación
      return false;
    }

    if (this.permisions.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Necesitas seleccionar un permiso por lo menos',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      }).then(() => this.modal.close()); // 🔥 Cierra modal también en validación
      return false;
    }

    let data = {
      name: this.name,
      permisions: this.permisions,
    };

    this.rolesService.registerRole(data).subscribe({
      next: (resp: any) => {
        console.log(resp);

        if (resp.message == 403) {
          Swal.fire({
            icon: 'error',
            title: 'Validación',
            text: resp.message_text,
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          }).then(() => this.modal.close()); // 🔥 Cierra modal en error del backend

        } else {
          Swal.fire({
            icon: 'success',
            title: 'Rol creado',
            text: 'El rol se registró correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.RoleC.emit(resp.role);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar el rol',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        }).then(() => this.modal.close()); // 🔥 Cerrar modal también en error HTTP
      }
    });
  }

}
