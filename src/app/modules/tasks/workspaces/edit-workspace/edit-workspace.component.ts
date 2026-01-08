import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';

@Component({
  selector: 'app-edit-workspace',
  templateUrl: './edit-workspace.component.html',
  styleUrls: ['./edit-workspace.component.scss']
})
export class EditWorkspaceComponent implements OnInit {

  @Input() WORKSPACE_SELECTED: any;
  @Output() WorkspaceE: EventEmitter<any> = new EventEmitter();
  
  workspaceForm: FormGroup;
  isLoading$: any;

  availableColors = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Morado', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarillo', value: '#f59e0b' },
    { name: 'Rojo', value: '#ef4444' },
    { name: 'Índigo', value: '#6366f1' },
    { name: 'Turquesa', value: '#14b8a6' }
  ];

  selectedColor: string = '#6366f1';

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    private workspaceService: WorkspaceService,
    private toast: ToastrService
  ) {
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      color: ['#6366f1']
    });
  }

  ngOnInit(): void {
    this.isLoading$ = this.workspaceService.isLoading$;
    
    // Cargar datos del workspace seleccionado
    if (this.WORKSPACE_SELECTED) {
      this.workspaceForm.patchValue({
        name: this.WORKSPACE_SELECTED.name,
        description: this.WORKSPACE_SELECTED.description || '',
        color: this.WORKSPACE_SELECTED.color || '#6366f1'
      });
      
      this.selectedColor = this.WORKSPACE_SELECTED.color || '#6366f1';
    }
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.workspaceForm.patchValue({ color: color });
  }

  save() {
    if (this.workspaceForm.invalid) {
      this.workspaceForm.markAllAsTouched();
      this.toast.warning('Por favor completa todos los campos requeridos', 'Validación');
      return;
    }

    const formData = {
      ...this.workspaceForm.value,
      color: this.selectedColor
    };

    this.workspaceService.updateWorkspace(this.WORKSPACE_SELECTED.id, formData).subscribe({
      next: (resp: any) => {
        console.log('Workspace actualizado:', resp);
        if (resp.message === 200) {
          this.toast.success('Espacio de trabajo actualizado exitosamente', 'Éxito');
          this.WorkspaceE.emit(resp.workspace);
          this.modal.close();
        } else {
          this.toast.error(resp.message_text || 'Error al actualizar espacio', 'Error');
        }
      },
      error: (error) => {
        console.error('Error al actualizar workspace:', error);
        this.toast.error('No se pudo actualizar el espacio de trabajo', 'Error');
      }
    });
  }

  close() {
    this.modal.dismiss();
  }

  isInvalidField(field: string): boolean {
    return this.workspaceForm.get(field)?.invalid && 
           this.workspaceForm.get(field)?.touched || false;
  }
}