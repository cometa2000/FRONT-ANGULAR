import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SIDEBAR } from 'src/app/config/config';
import { RolesService } from '../service/roles.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-roles',
  templateUrl: './edit-roles.component.html',
  styleUrls: ['./edit-roles.component.scss']
})
export class EditRolesComponent {
  
  @Output() RoleE: EventEmitter<any> = new EventEmitter();
  @Input()  ROLE_SELECTED:any;

  name:string = '';
  isLoading:any;

  SIDEBAR:any = SIDEBAR;

  permisions:any = [];
  constructor(
    public modal: NgbActiveModal,
    public rolesService: RolesService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.ROLE_SELECTED.name;
    this.permisions = this.ROLE_SELECTED.permission_pluck;
  }
  addPermission(permiso:string){
    let INDEX = this.permisions.findIndex((perm:string) => perm == permiso);
    if(INDEX != -1){
      this.permisions.splice(INDEX,1);
    }else{
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
      });
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
      });
      return false;
    }

    let data = {
      name: this.name,
      permisions: this.permisions,
    };

    this.rolesService.updateRole(this.ROLE_SELECTED.id, data).subscribe({
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
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Rol editado',
            text: 'El rol se editó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.RoleE.emit(resp.role);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo editar el rol',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

}
