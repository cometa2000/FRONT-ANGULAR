import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ClientSegmentService } from '../service/client-segment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-client-segment',
  templateUrl: './edit-client-segment.component.html',
  styleUrls: ['./edit-client-segment.component.scss']
})
export class EditClientSegmentComponent {

  @Output() ClientSegmentE: EventEmitter<any> = new EventEmitter();
  @Input() CLIENT_SEGMENT_SELECTED:any;
  
  name:string = '';
  address:string = '';
  state:number = 1;

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public clientsegmentService: ClientSegmentService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.CLIENT_SEGMENT_SELECTED.name;
    this.state = this.CLIENT_SEGMENT_SELECTED.state;
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
      state: this.state,
    };

    this.clientsegmentService.updateClientSegment(this.CLIENT_SEGMENT_SELECTED.id, data)
      .subscribe({
        next: (resp: any) => {
          // console.log(resp);

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
              title: 'Segmento editado',
              text: 'El segmento se editó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.ClientSegmentE.emit(resp.client_segment);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo editar el segmento',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
