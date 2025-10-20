import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';

@Component({
  selector: 'app-create-grupo',
  templateUrl: './create-grupo.component.html',
  styleUrls: ['./create-grupo.component.scss']
})
export class CreateGrupoComponent {
  @Output() GrupoC: EventEmitter<any> = new EventEmitter();
  name: string = '';
  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {}

  store() {
    if (!this.name.trim()) {
      this.toast.error('El nombre del grupo es requerido', 'Validación');
      return;
    }

    const data = { name: this.name };
    this.isLoading = true;

    this.grupoService.registerGrupo(data).subscribe({
      next: (resp: any) => {
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se registró correctamente', 'Éxito');
          this.GrupoC.emit(resp.grupo);
          this.modal.close();
        }
      },
      error: () => this.toast.error('Error al registrar el grupo', 'Error'),
      complete: () => this.isLoading = false
    });
  }
}
