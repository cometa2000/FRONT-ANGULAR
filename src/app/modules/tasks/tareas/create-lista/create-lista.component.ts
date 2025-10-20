import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';

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
      this.toast.error('El nombre de la lista es obligatorio', 'Validación');
      return;
    }

    // ✅ Incluir el grupo_id en el payload
    const data = { 
      name: this.name,
      grupo_id: this.grupo_id 
    };

    this.isLoading = true;

    this.tareaService.registerLista(data).subscribe({
      next: (resp: any) => {
        console.log('✅ Lista creada:', resp);
        if (resp.message === 200) {
          this.toast.success('La lista se registró correctamente', 'Éxito');
          this.ListaC.emit(resp.lista);
          this.modal.close();
        } else {
          this.toast.error('Error al registrar la lista', 'Error');
        }
      },
      error: (err) => {
        console.error('❌ Error al crear lista:', err);
        this.toast.error('Error al crear la lista', 'Error');
      },
      complete: () => this.isLoading = false
    });
  }
}