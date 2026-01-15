import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CronogramaProformasService } from './service/cronograma-proformas.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateEditEventComponent } from './components/create-edit-event/create-edit-event.component';
import { AuthService } from '../auth';

@Component({
  selector: 'app-cronograma-proformas',
  templateUrl: './cronograma-proformas.component.html',
  styleUrls: ['./cronograma-proformas.component.scss']
})
export class CronogramaProformasComponent {

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    events: [],
    editable: false, // Los eventos no serán arrastrables por defecto
    eventClick: (info) => this.handleEventClick(info),
    dateClick: (info) => this.handleDateClick(info),
  };

  isLoading$: any;
  user: any;
  canCreateEvents: boolean = false;

  constructor(
    public cronogramaService: CronogramaProformasService,
    public toast: ToastrService,
    public modalService: NgbModal,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.cronogramaService.isLoading$;
    this.user = this.authService.user;
    
    // Verificar si el usuario puede crear eventos
    this.canCreateEvents = this.user.role_id === 1 ;
    
    this.loadCalendarEvents();
  }

  // Cargar todos los eventos del calendario
  loadCalendarEvents() {
    this.cronogramaService.listCalendarEvents().subscribe((resp: any) => {
      console.log(resp);
      if (resp.message === 200) {
        this.calendarOptions = {
          ...this.calendarOptions,
          events: resp.events
        };
      }
    }, error => {
      this.toast.error('Error al cargar los eventos del calendario', 'Error');
      console.error(error);
    });
  }

  // Manejar clic en un evento existente
  handleEventClick(info: any) {
    const eventId = info.event.id;
    this.openEventDetail(eventId);
  }

  // Manejar clic en una fecha (crear nuevo evento)
  handleDateClick(info: any) {
    if (this.canCreateEvents) {
      this.openCreateEvent(info.dateStr);
    } else {
      this.toast.warning('No tienes permisos para crear eventos', 'Acceso denegado');
    }
  }

  // Abrir modal para crear evento
  openCreateEvent(date?: string) {
    if (!this.canCreateEvents) {
      this.toast.warning('No tienes permisos para crear eventos', 'Acceso denegado');
      return;
    }

    const modalRef = this.modalService.open(CreateEditEventComponent, {
      centered: true,
      size: 'lg'
    });
    
    modalRef.componentInstance.isEdit = false;
    if (date) {
      modalRef.componentInstance.selectedDate = date;
    }

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadCalendarEvents();
          this.toast.success('Evento creado exitosamente', 'Éxito');
        }
      },
      (reason) => {
        // Modal cerrado sin guardar
      }
    );
  }

  // Abrir modal para ver/editar evento
  openEventDetail(eventId: string) {
    this.cronogramaService.showCalendarEvent(eventId).subscribe((resp: any) => {
      console.log(resp);
      if (resp.message === 200) {
        const modalRef = this.modalService.open(CreateEditEventComponent, {
          centered: true,
          size: 'lg'
        });
        
        modalRef.componentInstance.isEdit = true;
        modalRef.componentInstance.event = resp.event;
        modalRef.componentInstance.canEdit = this.canCreateEvents;

        modalRef.result.then(
          (result) => {
            if (result === 'updated' || result === 'deleted') {
              this.loadCalendarEvents();
              const message = result === 'updated' ? 'Evento actualizado' : 'Evento eliminado';
              this.toast.success(message + ' exitosamente', 'Éxito');
            }
          },
          (reason) => {
            // Modal cerrado sin cambios
          }
        );
      }
    }, error => {
      this.toast.error('Error al cargar el evento', 'Error');
      console.error(error);
    });
  }

  // Método para abrir el modal de creación desde el botón
  onCreateEventClick() {
    this.openCreateEvent();
  }
}