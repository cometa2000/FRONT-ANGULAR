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
  selectedBackground: string = 'assets/media/fondos/fondo1.jpg';
  selectedBackgroundName: string = 'fondo1.jpg';
  
  // ✅ Lista de fondos predeterminados
  backgrounds = [
    { url: 'assets/media/fondos/fondo1.jpg', name: 'fondo1.jpg' },
    { url: 'assets/media/fondos/fondo2.png', name: 'fondo2.png' },
    { url: 'assets/media/fondos/fondo3.png', name: 'fondo3.png' },
    { url: 'assets/media/fondos/fondo4.jpg', name: 'fondo4.jpg' },
    { url: 'assets/media/fondos/fondo5.jpg', name: 'fondo5.jpg' },
    { url: 'assets/media/fondos/fondo6.jpg', name: 'fondo6.jpg' },
  ];
  
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

  /**
   * Seleccionar fondo
   */
  selectBackground(url: string, name: string) {
    this.selectedBackground = url;
    this.selectedBackgroundName = name;
  }

  /**
   * Guardar grupo
   */
  store() {
    if (!this.name.trim()) {
      this.toast.error('El nombre del grupo es requerido', 'Validación');
      return;
    }

    const data = { 
      name: this.name,
      image: this.selectedBackgroundName  // ✅ Enviar solo el nombre del archivo
    };

    this.grupoService.registerGrupo(data).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp);
        
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se registró correctamente', 'Éxito');
          this.GrupoC.emit(resp.grupo);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error('❌ Error al registrar:', err);
        this.toast.error('Error al registrar el grupo', 'Error');
      }
    });
  }
}