import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { Observable } from 'rxjs';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-grupo',
  templateUrl: './create-grupo.component.html',
  styleUrls: ['./create-grupo.component.scss']
})
export class CreateGrupoComponent {
  @Output() GrupoC: EventEmitter<any> = new EventEmitter();
  @Input() WORKSPACE_ID: number | null = null; // ✅ Recibir workspace_id
  @Input() WORKSPACE_NAME: string = ''; // ✅ Recibir nombre del workspace
  
  name: string = '';
  selectedBackground: string = 'assets/media/fondos/fondo1.png';
  selectedBackgroundName: string = 'fondo1.png';
  
  // ✅ Lista de fondos predeterminados
  backgrounds = [
    { url: 'assets/media/fondos/fondo1.png', name: 'fondo1.png' },
    { url: 'assets/media/fondos/fondo2.png', name: 'fondo2.png' },
    { url: 'assets/media/fondos/fondo3.png', name: 'fondo3.png' },
    { url: 'assets/media/fondos/fondo4.png', name: 'fondo4.png' },
    { url: 'assets/media/fondos/fondo5.png', name: 'fondo5.png' },
    { url: 'assets/media/fondos/fondo6.png', name: 'fondo6.png' },
    { url: 'assets/media/fondos/fondo7.png', name: 'fondo7.png' }, 
    { url: 'assets/media/fondos/fondo8.png', name: 'fondo8.png' },
    { url: 'assets/media/fondos/fondo9.png', name: 'fondo9.png' },
    { url: 'assets/media/fondos/fondo10.png', name: 'fondo10.png' },
    { url: 'assets/media/fondos/fondo11.png', name: 'fondo11.png' },
    { url: 'assets/media/fondos/fondo12.png', name: 'fondo12.png' },
  ];
  
  // ✅ Observable del servicio
  isLoading$: Observable<boolean>;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {
    // ✅ Asignar el Observable del servicio
    this.isLoading$ = this.grupoService.isLoading$;
  }

  ngOnInit() {
    console.log('🆕 Create Grupo - Workspace ID:', this.WORKSPACE_ID);
    console.log('🆕 Create Grupo - Workspace Name:', this.WORKSPACE_NAME);
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
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del grupo es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // ✅ Incluir workspace_id en los datos
    const data: any = { 
      name: this.name,
      image: this.selectedBackgroundName
    };

    // ✅ Agregar workspace_id si existe
    if (this.WORKSPACE_ID) {
      data.workspace_id = this.WORKSPACE_ID;
      console.log('📤 Enviando grupo con workspace_id:', this.WORKSPACE_ID);
    }

    console.log('📤 Datos enviados:', data);

    this.grupoService.registerGrupo(data).subscribe({
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
          const workspaceInfo = this.WORKSPACE_NAME ? ` en ${this.WORKSPACE_NAME}` : '';
          Swal.fire({
            icon: 'success',
            title: 'Grupo creado',
            text: `El grupo se registró correctamente${workspaceInfo}`,
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.GrupoC.emit(resp.grupo);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error('❌ Error al registrar:', err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al registrar el grupo',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

}