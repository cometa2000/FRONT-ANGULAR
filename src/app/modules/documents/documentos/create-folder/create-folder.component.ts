import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../../vista-documentos/service/vista-documento.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-folder',
  templateUrl: './create-folder.component.html',
  styleUrls: ['./create-folder.component.scss']
})
export class CreateFolderComponent {
  
  @Input() sucursale_id!: number;
  @Input() parent_id: number | null = null;
  @Input() parent_name: string = 'Raíz';
  
  @Output() FolderCreated = new EventEmitter<any>();

  name: string = '';
  description: string = '';
  isLoading: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    public vistaDocumentoService: VistaDocumentoService
  ) {}

  createFolder() {
    if (!this.name || this.name.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre de la carpeta es obligatorio'
      });
      return;
    }

    if (!this.sucursale_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Se requiere una sucursal'
      });
      return;
    }

    this.isLoading = true;

    const data = {
      name: this.name.trim(),
      description: this.description.trim(),
      sucursale_id: this.sucursale_id,
      parent_id: this.parent_id
    };

    this.vistaDocumentoService.createFolder(data).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Carpeta creada exitosamente',
            timer: 2000,
            showConfirmButton: false
          });
          
          this.FolderCreated.emit(resp.folder);
          this.modal.close();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.message_text || 'Error al crear la carpeta'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error creating folder:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message_text || 'Error al crear la carpeta'
        });
        this.isLoading = false;
      }
    });
  }
}