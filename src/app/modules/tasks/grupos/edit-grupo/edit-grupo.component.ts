import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-edit-grupo',
  templateUrl: './edit-grupo.component.html',
  styleUrls: ['./edit-grupo.component.scss']
})
export class EditGrupoComponent implements OnInit {
  @Output() GrupoE: EventEmitter<any> = new EventEmitter();
  @Input() GRUPO_SELECTED: any;
  
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
    { url: 'assets/media/fondos/fondo7.png', name: 'fondo7.png' }
  ];
  
  // ✅ Observable del servicio
  isLoading$: Observable<boolean>;

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {
    this.isLoading$ = this.grupoService.isLoading$;
  }

  ngOnInit(): void {
    // ✅ Cargar los datos actuales del grupo
    console.log('📝 Grupo seleccionado:', this.GRUPO_SELECTED);
    
    if (this.GRUPO_SELECTED) {
      this.name = this.GRUPO_SELECTED.name || '';
      
      // ✅ Cargar el fondo actual del grupo
      if (this.GRUPO_SELECTED.image) {
        this.selectedBackgroundName = this.GRUPO_SELECTED.image;
        this.selectedBackground = `assets/media/fondos/${this.GRUPO_SELECTED.image}`;
      }
    }
  }

  /**
   * Seleccionar fondo
   */
  selectBackground(url: string, name: string) {
    this.selectedBackground = url;
    this.selectedBackgroundName = name;
  }

  /**
   * Actualizar grupo
   */
  store() {
    if (!this.name.trim()) {
      this.toast.error('El nombre del grupo es requerido', 'Validación');
      return;
    }

    const data = { 
      name: this.name,
      image: this.selectedBackgroundName  // ✅ Enviar el nombre del archivo
    };

    console.log('📤 Enviando actualización:', data);

    this.grupoService.updateGrupo(this.GRUPO_SELECTED.id, data).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp);
        
        if (resp.message == 403) {
          this.toast.error(resp.message_text, 'Error');
        } else {
          this.toast.success('El grupo se actualizó correctamente', 'Éxito');
          this.GrupoE.emit(resp.grupo);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error('❌ Error al actualizar:', err);
        this.toast.error('Error al actualizar el grupo', 'Error');
      }
    });
  }
}