import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delte-lista',
  templateUrl: './delte-lista.component.html',
  styleUrls: ['./delte-lista.component.scss']
})
export class DelteListaComponent {
  @Output() ListaD: EventEmitter<any> = new EventEmitter();
  @Input() LISTA_SELECTED: any;

  isLoading: any;

  constructor(
    public modal: NgbActiveModal,
    public tareasService: TareaService,
    public toast: ToastrService,
  ) {}

  ngOnInit(): void {}

  delete() {
    // ✅ Sin Swal de confirmación: la propia modal HTML ya pregunta "¿estás seguro?"
    // Al llegar aquí el usuario ya confirmó presionando el botón ELIMINAR.

    if (typeof this.LISTA_SELECTED.id !== 'number') return;

    this.isLoading = true;

    this.tareasService.deleteLista(this.LISTA_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.isLoading = false;

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
            title: 'Lista eliminada',
            text: 'La lista se eliminó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.ListaD.emit(resp.message);
          this.modal.close();
        }
      },
      error: (err: any) => {
        console.error('❌ Error al eliminar lista:', err);
        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la lista',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

}