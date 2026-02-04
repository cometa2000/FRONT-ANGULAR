import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ClientSegmentService } from '../service/client-segment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-client-segment',
  templateUrl: './delete-client-segment.component.html',
  styleUrls: ['./delete-client-segment.component.scss']
})
export class DeleteClientSegmentComponent {

  @Output() ClientSegmentD: EventEmitter<any> = new EventEmitter();
  @Input()  CLIENT_SEGMENT_SELECTED:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public clientSegmentService: ClientSegmentService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete() {

    this.clientSegmentService.deleteClientSegment(this.CLIENT_SEGMENT_SELECTED.id)
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
              title: 'Segmento eliminado',
              text: 'El segmento se eliminó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.ClientSegmentD.emit(resp.message);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el segmento',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
