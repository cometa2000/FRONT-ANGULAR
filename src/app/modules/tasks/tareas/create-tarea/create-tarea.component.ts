import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/modules/auth'; // 👈 importar AuthService

@Component({
  selector: 'app-create-tarea',
  templateUrl: './create-tarea.component.html',
  styleUrls: ['./create-tarea.component.scss']
})
export class CreateTareaComponent {
  @Output() TareaC: EventEmitter<any> = new EventEmitter();
  @Input() users: any = [];
  @Input() TAREAS: any = [];
  @Input() sucursales: any = [];
  @Input() lista_id!: number; // 👈 viene del modal

  name: string = '';
  description: string = '';
  type_task: string = 'simple';
  priority: string = 'medium';
  
  user_id: number | null = null;
  selectedSucursalName: string = '';

  start_date: any;
  due_date: any;

  estimated_time: string = '';
  file_path: string = '';
  budget: string = '';
  attendees: string = '';
  subtasks: string = '';

  isLoading: any;

  constructor(
    public modal: NgbActiveModal,
    public tareaService: TareaService,
    public toast: ToastrService, // 👈 inyectamos AuthService
  ) {}

  ngOnInit(): void {
    // obtener automáticamente el id del usuario logueado
  }

  store() {
    if (!this.name.trim()) {
      this.toast.error('Validación', 'El nombre de la tarea es requerido');
      return;
    }

    // 👇 aquí ya se incluyen user_id y lista_id automáticamente
    let data = {
      name: this.name,
      description: this.description,
      type_task: this.type_task,
      priority: this.priority,
      lista_id: this.lista_id, // 👈 lista seleccionada
      start_date: this.start_date,
      due_date: this.due_date,
      estimated_time: this.estimated_time,
      budget: this.budget,
      attendees: this.attendees,
      subtasks: this.subtasks,
      file_path: this.file_path
    };

    this.tareaService.registerTarea(data).subscribe({
      next: (resp: any) => {
        console.log(resp);
        if (resp.message == 403) {
          this.toast.error('Validación', resp.message_text);
        } else {
          this.toast.success('Éxito', 'La tarea se registró correctamente');
          this.TareaC.emit(resp.tarea);
          this.modal.close();
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Error', 'No se pudo registrar la tarea');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.file_path = file.name;
    }
  }
}
