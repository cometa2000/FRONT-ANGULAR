import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TareaService } from '../service/tarea.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-tarea',
  templateUrl: './delete-tarea.component.html',
  styleUrls: ['./delete-tarea.component.scss']
})
export class DeleteTareaComponent {
  @Output() TareaD: EventEmitter<any> = new EventEmitter();
  @Input()  TAREA_SELECTED:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public tareasService: TareaService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete() {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar tarea?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then(result => {

      if (result.isConfirmed && typeof this.TAREA_SELECTED.id === 'number') {

        this.tareasService.deleteTarea(this.TAREA_SELECTED.id).subscribe((resp: any) => {
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
              title: 'Tarea eliminada',
              text: 'La tarea se eliminó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.TareaD.emit(resp.message);
            this.modal.close();
          }
        });

      }

    });
  }

}
