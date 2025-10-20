import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-grupo',
  templateUrl: './edit-grupo.component.html',
  styleUrls: ['./edit-grupo.component.scss']
})
export class EditGrupoComponent {
  @Output() GrupoE: EventEmitter<any> = new EventEmitter();
  @Input() GRUPO_SELECTED: any;

  name: string = '';
  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {}

  ngOnInit(): void {
    if (this.GRUPO_SELECTED) {
      this.name = this.GRUPO_SELECTED.name;
    }
  }

  store() {
    if (!this.name.trim()) {
      this.toast.error('El nombre del grupo es requerido', 'Validación');
      return;
    }

    const data = { name: this.name };
    this.isLoading = true;

    this.grupoService.updateGrupo(this.GRUPO_SELECTED.id, data).subscribe({
      next: (resp: any) => {
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se editó correctamente', 'Éxito');
          this.GrupoE.emit(resp.grupo);
          this.modal.close();
        }
      },
      error: () => this.toast.error('Error al editar el grupo', 'Error'),
      complete: () => this.isLoading = false
    });
  }
}
