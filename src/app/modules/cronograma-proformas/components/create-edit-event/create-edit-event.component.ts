import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CronogramaProformasService } from '../../service/cronograma-proformas.service';

@Component({
  selector: 'app-create-edit-event',
  templateUrl: './create-edit-event.component.html',
  styleUrls: ['./create-edit-event.component.scss']
})
export class CreateEditEventComponent implements OnInit {

  @Input() isEdit: boolean = false;
  @Input() event: any = null;
  @Input() selectedDate: string = '';
  @Input() canEdit: boolean = false;

  eventForm: FormGroup;
  isLoading: boolean = false;

  // Colores predefinidos para los eventos
  eventColors = [
    { name: 'Azul', value: '#3788d8' },
    { name: 'Verde', value: '#28a745' },
    { name: 'Rojo', value: '#dc3545' },
    { name: 'Naranja', value: '#fd7e14' },
    { name: 'Morado', value: '#6f42c1' },
    { name: 'Cyan', value: '#17a2b8' },
    { name: 'Amarillo', value: '#ffc107' },
    { name: 'Rosa', value: '#e83e8c' },
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private cronogramaService: CronogramaProformasService,
    private toast: ToastrService
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      start_date: ['', Validators.required],
      end_date: [''],
      all_day: [false],
      color: ['#3788d8']
    });
  }

  ngOnInit(): void {
    if (this.isEdit && this.event) {
      this.loadEventData();
    } else if (this.selectedDate) {
      // Si se seleccionó una fecha, establecerla como fecha inicial
      this.eventForm.patchValue({
        start_date: this.selectedDate
      });
    }

    // Si el usuario no puede editar, deshabilitar el formulario
    if (this.isEdit && !this.canEdit) {
      this.eventForm.disable();
    }
  }

  loadEventData() {
    this.eventForm.patchValue({
      title: this.event.title,
      description: this.event.description,
      start_date: this.event.start_date,
      end_date: this.event.end_date,
      all_day: this.event.all_day,
      color: this.event.color
    });
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      this.toast.warning('Por favor completa todos los campos requeridos', 'Formulario inválido');
      return;
    }

    if (!this.canEdit && this.isEdit) {
      this.toast.warning('No tienes permisos para editar eventos', 'Acceso denegado');
      return;
    }

    this.isLoading = true;

    const formData = this.eventForm.value;

    if (this.isEdit) {
      // Actualizar evento existente
      this.cronogramaService.updateCalendarEvent(this.event.id, formData).subscribe(
        (resp: any) => {
          console.log(resp);
          if (resp.message === 200) {
            this.toast.success(resp.text, 'Éxito');
            this.activeModal.close('updated');
          }
          this.isLoading = false;
        },
        (error) => {
          console.error(error);
          const errorMessage = error.error?.error || 'Error al actualizar el evento';
          this.toast.error(errorMessage, 'Error');
          this.isLoading = false;
        }
      );
    } else {
      // Crear nuevo evento
      this.cronogramaService.createCalendarEvent(formData).subscribe(
        (resp: any) => {
          console.log(resp);
          if (resp.message === 201) {
            this.toast.success(resp.text, 'Éxito');
            this.activeModal.close('created');
          }
          this.isLoading = false;
        },
        (error) => {
          console.error(error);
          const errorMessage = error.error?.error || 'Error al crear el evento';
          this.toast.error(errorMessage, 'Error');
          this.isLoading = false;
        }
      );
    }
  }

  onDelete() {
    if (!this.canEdit) {
      this.toast.warning('No tienes permisos para eliminar eventos', 'Acceso denegado');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      return;
    }

    this.isLoading = true;

    this.cronogramaService.deleteCalendarEvent(this.event.id).subscribe(
      (resp: any) => {
        console.log(resp);
        if (resp.message === 200) {
          this.toast.success(resp.text, 'Éxito');
          this.activeModal.close('deleted');
        }
        this.isLoading = false;
      },
      (error) => {
        console.error(error);
        const errorMessage = error.error?.error || 'Error al eliminar el evento';
        this.toast.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    );
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.eventForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('maxlength')) {
      return 'Has excedido el número máximo de caracteres';
    }
    return '';
  }
}