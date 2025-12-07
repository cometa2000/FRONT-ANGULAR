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
    // ✅ Suscribirse al observable de carga del servicio
    this.isLoading = this.rolesService.isLoading$;
  }

  delete() {
    // ✅ Llamada directa al servicio
    // ✅ El botón se deshabilita automáticamente porque isLoading$ = true
    this.rolesService.deleteUser(this.USER_SELECTED.id).subscribe({

      next: (resp: any) => {

        if (resp.message == 403) {
          // Mostrar error
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
          // Emitir evento antes de cerrar
          this.UserD.emit(resp.role);
          
          // Mostrar éxito
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El usuario se eliminó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }

        // ✅ Cerrar modal INMEDIATAMENTE después de mostrar el toast
        // Esto previene que el usuario haga clic múltiples veces
        this.modal.close();

      },

      error: () => {
        // Mostrar error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el usuario',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        // ✅ Cerrar modal INMEDIATAMENTE incluso en caso de error
        this.modal.close();
      }

    });

  }

}