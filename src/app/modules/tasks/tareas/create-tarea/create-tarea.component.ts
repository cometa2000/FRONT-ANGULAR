import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/modules/auth'; // 👈 importar AuthService
import Swal from 'sweetalert2';

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
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la tarea es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    let data = {
      name: this.name,
      description: this.description,
      type_task: this.type_task,
      priority: this.priority,
      lista_id: this.lista_id,
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
          Swal.fire({
            icon: 'success',
            title: 'Tarea creada',
            text: 'La tarea se registró correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.TareaC.emit(resp.tarea);
          this.modal.close();
        }
      },

      error: (err) => {
        console.error(err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar la tarea',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
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
