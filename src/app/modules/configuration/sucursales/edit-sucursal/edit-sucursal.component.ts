import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SucursalService } from '../service/sucursal.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-sucursal',
  templateUrl: './edit-sucursal.component.html',
  styleUrls: ['./edit-sucursal.component.scss']
})
export class EditSucursalComponent {

  @Output() SucursalE: EventEmitter<any> = new EventEmitter();
  @Input() SUCURSAL_SELECTED:any;
  
  name:string = '';
  address:string = '';
  state:number = 1;

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
    this.name = this.SUCURSAL_SELECTED.name;
    this.address = this.SUCURSAL_SELECTED.address;
    this.state = this.SUCURSAL_SELECTED.state;
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
      state: this.state,
    };

    this.sucursalService.updateSucursal(this.SUCURSAL_SELECTED.id, data)
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
              title: 'Sucursal editada',
              text: 'La sucursal se editó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.SucursalE.emit(resp.sucursal);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la sucursal',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
