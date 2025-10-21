import { Component, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-grupo',
  templateUrl: './create-grupo.component.html',
  styleUrls: ['./create-grupo.component.scss']
})
export class CreateGrupoComponent {
  @Output() GrupoC: EventEmitter<any> = new EventEmitter();
  name: string = '';
  
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

  store() {
    if (!this.name.trim()) {
      this.toast.error('El nombre del grupo es requerido', 'Validación');
      return;
    }

    const data = { name: this.name };
    
    // ✅ Ya NO asignamos isLoading manualmente, el servicio lo maneja

    this.grupoService.registerGrupo(data).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp); // Debug
        
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se registró correctamente', 'Éxito');
          this.GrupoC.emit(resp.grupo);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error('❌ Error al registrar:', err); // Debug
        this.toast.error('Error al registrar el grupo', 'Error');
      }
    });
  }
}