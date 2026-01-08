import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { WorkspaceService } from '../service/workspace.service';

@Component({
  selector: 'app-create-workspace',
  templateUrl: './create-workspace.component.html',
  styleUrls: ['./create-workspace.component.scss']
})
export class CreateWorkspaceComponent implements OnInit {

  @Output() WorkspaceC: EventEmitter<any> = new EventEmitter();
  
  workspaceForm: FormGroup;
  isLoading$: any;

  // Colores predefinidos para los workspaces
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

  selectedColor: string = '#6366f1'; // Color por defecto

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
  }

  /**
   * 🎨 Seleccionar color
   */
  selectColor(color: string) {
    this.selectedColor = color;
    this.workspaceForm.patchValue({ color: color });
  }

  /**
   * ✅ Guardar workspace
   */
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

    this.workspaceService.registerWorkspace(formData).subscribe({
      next: (resp: any) => {
        console.log('Workspace creado:', resp);
        if (resp.message === 200) {
          this.toast.success('Espacio de trabajo creado exitosamente', 'Éxito');
          this.WorkspaceC.emit(resp.workspace);
          this.modal.close();
        } else {
          this.toast.error(resp.message_text || 'Error al crear espacio', 'Error');
        }
      },
      error: (error) => {
        console.error('Error al crear workspace:', error);
        this.toast.error('No se pudo crear el espacio de trabajo', 'Error');
      }
    });
  }

  /**
   * ❌ Cerrar modal
   */
  close() {
    this.modal.dismiss();
  }

  /**
   * 🔍 Validadores de formulario
   */
  isInvalidField(field: string): boolean {
    return this.workspaceForm.get(field)?.invalid && 
           this.workspaceForm.get(field)?.touched || false;
  }
}