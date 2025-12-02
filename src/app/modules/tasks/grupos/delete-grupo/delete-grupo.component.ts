import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

import Swal from 'sweetalert2';

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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el grupo',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    this.grupoService.deleteGrupo(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp);

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
            title: 'Grupo eliminado',
            text: 'El grupo se eliminó correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.GrupoD.emit(this.GRUPO_SELECTED);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error('❌ Error al eliminar:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el grupo',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

}