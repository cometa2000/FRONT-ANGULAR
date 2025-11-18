import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SucursalService } from '../service/sucursal.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-sucursal',
  templateUrl: './delete-sucursal.component.html',
  styleUrls: ['./delete-sucursal.component.scss']
})
export class DeleteSucursalComponent {

  @Output() SucursalD: EventEmitter<any> = new EventEmitter();
  @Input()  SUCURSAL_SELECTED:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public sucursalesService: SucursalService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete() {

    this.sucursalesService.deleteSucursal(this.SUCURSAL_SELECTED.id)
      .subscribe({
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
              title: 'Sucursal eliminada',
              text: 'La sucursal se eliminó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.SucursalD.emit(resp.message);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la sucursal',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
