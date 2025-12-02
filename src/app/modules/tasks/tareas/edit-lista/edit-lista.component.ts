import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-lista',
  templateUrl: './edit-lista.component.html',
  styleUrls: ['./edit-lista.component.scss']
})
export class EditListaComponent {
  @Output() ListaE: EventEmitter<any> = new EventEmitter();
  @Input() LISTA_SELECTED:any;
  @Input() users:any = [];
  @Input() TAREAS:any = [];
  @Input() sucursales:any = [];

  
  name:string = '';
  
  

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public tareaService: TareaService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.LISTA_SELECTED.name;
   
  }

  store() {
    if (!this.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la lista es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return false;
    }

    let data = { name: this.name };

    if (typeof this.LISTA_SELECTED.id !== 'number') return;

    this.tareaService.updateLista(this.LISTA_SELECTED.id, data).subscribe({
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
            title: 'Lista actualizada',
            text: 'La lista se editó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.ListaE.emit(resp.tarea);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la lista',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

}
