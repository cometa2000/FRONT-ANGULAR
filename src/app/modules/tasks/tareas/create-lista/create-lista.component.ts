import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-lista',
  templateUrl: './create-lista.component.html',
  styleUrls: ['./create-lista.component.scss']
})
export class CreateListaComponent {
  @Input() grupo_id!: number; // ✅ Recibe el grupo_id desde el modal
  @Output() ListaC = new EventEmitter<any>();

  name: string = '';
  isLoading: any;

  constructor(
    public modal: NgbActiveModal,
    public tareaService: TareaService,
    public toast: ToastrService,
  ) {}

  store() {
    if (!this.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la lista es obligatorio',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const data = { 
      name: this.name,
      grupo_id: this.grupo_id
    };

    this.isLoading = true;

    this.tareaService.registerLista(data).subscribe({
      next: (resp: any) => {
        console.log('✅ Lista creada:', resp);

        if (resp.message === 200) {

          Swal.fire({
            icon: 'success',
            title: 'Lista creada',
            text: 'La lista se registró correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.ListaC.emit(resp.lista);

          this.modal.close(resp.lista);

        } else {

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al registrar la lista',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

        }
      },

      error: (err) => {
        console.error('❌ Error al crear lista:', err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear la lista',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },

      complete: () => this.isLoading = false
    });
  }

}