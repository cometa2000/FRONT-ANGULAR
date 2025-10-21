import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-delete-grupo',
  templateUrl: './delete-grupo.component.html',
  styleUrls: ['./delete-grupo.component.scss']
})
export class DeleteGrupoComponent {
  @Output() GrupoD: EventEmitter<any> = new EventEmitter();
  @Input() GRUPO_SELECTED: any;

  // ✅ CORRECCIÓN: Usar el Observable del servicio
  isLoading$: Observable<boolean>;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {
    // ✅ Asignar el Observable del servicio
    this.isLoading$ = this.grupoService.isLoading$;
  }

  delete() {
    if (!this.GRUPO_SELECTED?.id) {
      this.toast.error('No se encontró el grupo', 'Error');
      return;
    }

    // ✅ Ya NO asignamos isLoading manualmente, el servicio lo maneja

    this.grupoService.deleteGrupo(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp); // Debug
        
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se eliminó correctamente', 'Éxito');
          this.GrupoD.emit(this.GRUPO_SELECTED);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err); // Debug
        this.toast.error('Error al eliminar el grupo', 'Error');
      }
    });
  }
}