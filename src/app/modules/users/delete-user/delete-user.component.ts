import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UsersService } from '../service/users.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SIDEBAR } from 'src/app/config/config';

import Swal from 'sweetalert2';


@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.scss']
})
export class DeleteUserComponent {

  @Output() UserD: EventEmitter<any> = new EventEmitter();
  @Input()  USER_SELECTED:any;

  name:string = '';
  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public rolesService: UsersService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete() {

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.rolesService.deleteUser(this.USER_SELECTED.id).subscribe({

          next: (resp: any) => {

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
                title: 'Eliminado',
                text: 'El usuario se eliminó correctamente',
                timer: 3500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
              });

              this.UserD.emit(resp.role);
              this.modal.close();
            }

          },

          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el usuario',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }

        });

      }

    });

  }

}
