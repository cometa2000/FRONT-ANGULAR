import { Component, EventEmitter, Output } from '@angular/core';
import { SucursalService } from '../service/sucursal.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-sucursal',
  templateUrl: './create-sucursal.component.html',
  styleUrls: ['./create-sucursal.component.scss']
})
export class CreateSucursalComponent {

  @Output() SucursalC: EventEmitter<any> = new EventEmitter();
  name:string = '';
  address:string = '';

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public sucursalService: SucursalService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    
  }

  store() {
    if (!this.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la sucursal es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return false;
    }

    let data = {
      name: this.name,
      address: this.address,
    };

    this.sucursalService.registerSucursal(data).subscribe({
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
            title: 'Sucursal registrada',
            text: 'La sucursal se registró correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.SucursalC.emit(resp.sucursal);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al guardar la sucursal',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


}
