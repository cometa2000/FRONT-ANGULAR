import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { TareaService } from '../service/tarea.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fechas',
  templateUrl: './fechas.component.html',
  styleUrls: ['./fechas.component.scss']
})
export class FechasComponent implements OnInit {
  @Input() tareaId?: number;
  @Output() fechasActualizadas = new EventEmitter<any>();

  showModal: boolean = false;

  // Formulario
  startDate: string = '';
  dueDate: string = '';

  // Estado actual mostrado en la tarjeta
  currentStartDate: string = '';
  currentDueDate: string = '';
  hasDates: boolean = false;

  // Flags
  enableDates: boolean = true;
  
  // 🆕 Notificaciones
  enableNotifications: boolean = false;
  notificationDaysBefore: number = 1;
  currentNotificationsEnabled: boolean = false;
  currentNotificationDaysBefore: number = 1;

  constructor(private tareaService: TareaService) {}

  ngOnInit(): void {
    this.loadFechas();
  }

  loadFechas(): void {
    if (!this.tareaId) return;
    
    this.tareaService.show(String(this.tareaId!)).subscribe({
      next: (resp: any) => {
        if (resp.tarea) {
          this.currentStartDate = resp.tarea.start_date || '';
          this.currentDueDate = resp.tarea.due_date || '';
          this.hasDates = !!(this.currentStartDate || this.currentDueDate);

          // Para abrir modal con lo actual
          this.startDate = this.currentStartDate || '';
          this.dueDate = this.currentDueDate || '';

          // enableDates en función de si hay fechas cargadas
          this.enableDates = this.hasDates;
          
          // 🆕 Cargar estado de notificaciones
          this.currentNotificationsEnabled = resp.tarea.notifications_enabled || false;
          this.currentNotificationDaysBefore = resp.tarea.notification_days_before || 1;
          this.enableNotifications = this.currentNotificationsEnabled;
          this.notificationDaysBefore = this.currentNotificationDaysBefore;
          
          console.log('📅 Fechas y notificaciones cargadas:', {
            hasDates: this.hasDates,
            start_date: this.currentStartDate,
            due_date: this.currentDueDate,
            notifications_enabled: this.currentNotificationsEnabled,
            notification_days_before: this.currentNotificationDaysBefore
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar fechas:', error);
      }
    });
  }

  openModal(): void {
    this.showModal = true;
    // Sincronizamos el formulario con el estado actual
    this.startDate = this.currentStartDate || new Date().toISOString().split('T')[0];
    this.dueDate = this.currentDueDate || '';
    this.enableDates = !!(this.currentStartDate || this.currentDueDate);
    
    // 🆕 Sincronizar notificaciones
    this.enableNotifications = this.currentNotificationsEnabled;
    this.notificationDaysBefore = this.currentNotificationDaysBefore || 1;
  }

  closeModal(): void {
    this.showModal = false;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  }

  isOverdue(): boolean {
    if (!this.currentDueDate) return false;
    const today = new Date();
    const due = new Date(this.currentDueDate);
    if (isNaN(due.getTime())) return false;
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const d = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    return d < t;
  }

  isDueSoon(): boolean {
    if (!this.currentDueDate) return false;
    const today = new Date();
    const due = new Date(this.currentDueDate);
    if (isNaN(due.getTime())) return false;

    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endSoon = start + 3 * 24 * 60 * 60 * 1000; // 3 días
    const d = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    return d >= start && d <= endSoon;
  }

  // 🆕 Guardar fechas y notificaciones
  saveFechas(): void {
    this.saveDates();
  }

  saveDates(): void {
    if (!this.tareaId) return;

    // 🆕 Validar que si se habilitan notificaciones, haya una fecha de vencimiento
    if (this.enableNotifications && !this.dueDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Debes establecer una fecha de vencimiento para habilitar las notificaciones',
        confirmButtonColor: '#EB5A46'
      });
      return;
    }

    const updateData: any = this.enableDates
      ? {
          start_date: this.startDate || null,
          due_date: this.dueDate || null,
          // 🆕 Incluir configuración de notificaciones
          notifications_enabled: this.enableNotifications,
          notification_days_before: this.enableNotifications ? this.notificationDaysBefore : null
        }
      : {
          start_date: null,
          due_date: null,
          // 🆕 Si no hay fechas, deshabilitar notificaciones
          notifications_enabled: false,
          notification_days_before: null
        };

    console.log('💾 Guardando fechas y notificaciones:', updateData);

    this.tareaService.update(String(this.tareaId!), updateData).subscribe({
      next: (resp: any) => {
        this.currentStartDate = resp.tarea?.start_date ?? (this.enableDates ? (this.startDate || '') : '');
        this.currentDueDate = resp.tarea?.due_date ?? (this.enableDates ? (this.dueDate || '') : '');
        this.hasDates = !!(this.currentStartDate || this.currentDueDate);
        
        // 🆕 Actualizar estado de notificaciones
        this.currentNotificationsEnabled = resp.tarea?.notifications_enabled || false;
        this.currentNotificationDaysBefore = resp.tarea?.notification_days_before || 1;
        
        this.closeModal();
        this.fechasActualizadas.emit(resp.tarea);
        
        // 🆕 Mensaje de éxito más informativo
        let successMessage = 'Fechas guardadas correctamente';
        if (this.enableNotifications) {
          successMessage += `. Recibirás notificaciones ${this.notificationDaysBefore} día(s) antes del vencimiento.`;
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: successMessage,
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al guardar fechas:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron guardar las fechas y notificaciones',
          confirmButtonColor: '#EB5A46'
        });
      }
    });
  }

  // 🆕 Eliminar fechas y notificaciones
  deleteFechas(): void {
    this.clearDates();
  }

  clearDates(): void {
    if (!this.tareaId) return;

    Swal.fire({
      title: '¿Eliminar fechas?',
      text: 'Se eliminarán las fechas y la configuración de notificaciones',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#B3BAC5',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const updateData = { 
          start_date: null, 
          due_date: null,
          // 🆕 Eliminar también notificaciones
          notifications_enabled: false,
          notification_days_before: null
        };

        this.tareaService.update(String(this.tareaId!), updateData).subscribe({
          next: (resp: any) => {
            this.hasDates = false;
            this.currentStartDate = '';
            this.currentDueDate = '';
            this.currentNotificationsEnabled = false;
            this.currentNotificationDaysBefore = 1;
            this.closeModal();
            this.fechasActualizadas.emit(resp.tarea);
            
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Fechas y notificaciones eliminadas correctamente',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al eliminar fechas:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron eliminar las fechas',
              confirmButtonColor: '#EB5A46'
            });
          }
        });
      }
    });
  }
}