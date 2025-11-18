import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ClientSegmentService } from '../service/client-segment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-client-segment',
  templateUrl: './create-client-segment.component.html',
  styleUrls: ['./create-client-segment.component.scss']
})
export class CreateClientSegmentComponent {

  @Output() ClientSegmentC: EventEmitter<any> = new EventEmitter();
  name:string = '';
  address:string = '';

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public clientSegmentService: ClientSegmentService,
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
        text: 'El nombre del segmento es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return false;
    }

    let data = {
      name: this.name,
    };

    this.clientSegmentService.registerClientSegment(data)
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
              title: 'Segmento creado',
              text: 'El segmento se registró correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.ClientSegmentC.emit(resp.client_segment);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo registrar el segmento',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
