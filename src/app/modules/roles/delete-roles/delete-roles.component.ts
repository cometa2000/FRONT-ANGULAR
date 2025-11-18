import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { data } from 'jquery';
import { ToastrService } from 'ngx-toastr';
import { SIDEBAR } from 'src/app/config/config';
import { RolesService } from '../service/roles.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-roles',
  templateUrl: './delete-roles.component.html',
  styleUrls: ['./delete-roles.component.scss']
})
export class DeleteRolesComponent {

  @Output() RoleD: EventEmitter<any> = new EventEmitter();
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
  }

  delete() {

    this.rolesService.deleteRole(this.ROLE_SELECTED.id).subscribe({
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
            title: 'Rol eliminado',
            text: 'El rol se eliminó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.RoleD.emit(resp.role);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el rol',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


}
