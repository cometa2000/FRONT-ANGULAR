import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';

@Component({
  selector: 'app-delete-workspace',
  templateUrl: './delete-workspace.component.html',
  styleUrls: ['./delete-workspace.component.scss']
})
export class DeleteWorkspaceComponent implements OnInit {

  @Input() WORKSPACE_SELECTED: any;
  @Output() WorkspaceD: EventEmitter<any> = new EventEmitter();
  
  isLoading$: any;
  confirmationText: string = '';
  gruposCount: number = 0;

  constructor(
    public modal: NgbActiveModal,
    private workspaceService: WorkspaceService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.workspaceService.isLoading$;
    this.gruposCount = this.WORKSPACE_SELECTED?.grupos?.length || 0;
  }

  /**
   * 🗑️ Eliminar workspace
   */
  delete() {
    // Validar confirmación
    if (this.confirmationText.trim().toLowerCase() !== 'eliminar') {
      this.toast.warning('Escribe "eliminar" para confirmar', 'Confirmación requerida');
      return;
    }

    this.workspaceService.deleteWorkspace(this.WORKSPACE_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('Workspace eliminado:', resp);
        if (resp.message === 200) {
          this.toast.success('Espacio de trabajo eliminado exitosamente', 'Éxito');
          this.WorkspaceD.emit(this.WORKSPACE_SELECTED);
          this.modal.close();
        } else {
          this.toast.error(resp.message_text || 'Error al eliminar espacio', 'Error');
        }
      },
      error: (error) => {
        console.error('Error al eliminar workspace:', error);
        
        // Manejar errores específicos
        if (error.status === 409) {
          this.toast.error('No se puede eliminar. El espacio tiene grupos activos', 'Error');
        } else {
          this.toast.error('No se pudo eliminar el espacio de trabajo', 'Error');
        }
      }
    });
  }

  close() {
    this.modal.dismiss();
  }

  /**
   * 🔍 Validar si se puede eliminar
   */
  get canDelete(): boolean {
    return this.confirmationText.trim().toLowerCase() === 'eliminar';
  }
}