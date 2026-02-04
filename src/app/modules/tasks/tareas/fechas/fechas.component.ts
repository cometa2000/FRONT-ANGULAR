import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TareaService } from '../service/tarea.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fechas',
  templateUrl: './fechas.component.html',
  styleUrls: ['./fechas.component.scss']
})
export class FechasComponent implements OnInit, OnChanges {
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

  // 🆕 Detectar cambios en el @Input tareaId
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tareaId'] && !changes['tareaId'].firstChange) {
      console.log('🔄 tareaId cambió, recargando fechas...');
      this.loadFechas();
    }
  }

  loadFechas(): void {
    if (!this.tareaId) return;
    
    this.tareaService.show(String(this.tareaId!)).subscribe({
      next: (resp: any) => {
        if (resp.tarea) {
          this.currentStartDate = resp.tarea.start_date || '';
          this.currentDueDate = resp.tarea.due_date || '';
          this.hasDates = !!(this.currentStartDate || this.currentDueDate);

          // Para el formulario, usar formato correcto para inputs
          this.startDate = this.convertToInputFormat(this.currentStartDate);
          this.dueDate = this.convertToInputFormat(this.currentDueDate);

          // enableDates en función de si hay fechas cargadas
          this.enableDates = this.hasDates;
          
          // Cargar estado de notificaciones
          this.currentNotificationsEnabled = resp.tarea.notifications_enabled || false;
          this.currentNotificationDaysBefore = resp.tarea.notification_days_before || 1;
          this.enableNotifications = this.currentNotificationsEnabled;
          this.notificationDaysBefore = this.currentNotificationDaysBefore;
          
          console.log('📅 Fechas y notificaciones cargadas:', {
            hasDates: this.hasDates,
            start_date_raw: this.currentStartDate,
            start_date_formatted: this.startDate,
            due_date_raw: this.currentDueDate,
            due_date_formatted: this.dueDate,
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
    
    // Si ya hay fechas, cargar las actuales en formato correcto para inputs
    if (this.hasDates) {
      this.startDate = this.convertToInputFormat(this.currentStartDate);
      this.dueDate = this.convertToInputFormat(this.currentDueDate);
      this.enableDates = true;
      
      console.log('📅 Fechas convertidas para inputs:', {
        currentStartDate: this.currentStartDate,
        startDate: this.startDate,
        currentDueDate: this.currentDueDate,
        dueDate: this.dueDate
      });
    } else {
      // Si no hay fechas, asignar fecha actual como inicio
      this.startDate = new Date().toISOString().split('T')[0];
      this.dueDate = '';
      this.enableDates = true;
    }
    
    // Sincronizar notificaciones
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

  /**
   * Convertir fecha a formato YYYY-MM-DD para inputs type="date"
   */
  private convertToInputFormat(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      // Crear objeto Date desde la cadena
      const date = new Date(dateStr);
      
      // Verificar si es una fecha válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateStr);
        return '';
      }
      
      // Obtener año, mes y día
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Retornar en formato YYYY-MM-DD
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error al convertir fecha:', error);
      return '';
    }
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
    // 🔥 Narrowing real: TS ahora sabe que tareaId es number
    if (typeof this.tareaId !== 'number') {
      console.error('❌ tareaId es undefined');
      return;
    }

    const tareaId = this.tareaId; // ← clave para evitar TS2345

    // Validación notificaciones
    if (this.enableNotifications && !this.dueDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Debes establecer una fecha de vencimiento para habilitar las notificaciones',
        toast: true,
        position: 'top-end',
        timer: 3500,
        showConfirmButton: false
      });
      return;
    }

    const updateData: any = this.enableDates
      ? {
          start_date: this.startDate || null,
          due_date: this.dueDate || null,
          notifications_enabled: this.enableNotifications,
          notification_days_before: this.enableNotifications ? this.notificationDaysBefore : null
        }
      : {
          start_date: null,
          due_date: null,
          notifications_enabled: false,
          notification_days_before: null
        };

    console.log('💾 Guardando fechas y notificaciones:', updateData);

    this.tareaService.update(String(tareaId), updateData).subscribe({
      next: (resp: any) => {
        this.currentStartDate =
          resp.tarea?.start_date ?? (this.enableDates ? this.startDate || '' : '');
        this.currentDueDate =
          resp.tarea?.due_date ?? (this.enableDates ? this.dueDate || '' : '');

        this.hasDates = !!(this.currentStartDate || this.currentDueDate);

        this.currentNotificationsEnabled = resp.tarea?.notifications_enabled || false;
        this.currentNotificationDaysBefore = resp.tarea?.notification_days_before || 1;

        this.closeModal();
        this.fechasActualizadas.emit(resp.tarea);

        let successMessage = 'Fechas guardadas correctamente';
        if (this.enableNotifications) {
          successMessage += `. Recibirás notificaciones ${this.notificationDaysBefore} día(s) antes del vencimiento.`;
        }

        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: successMessage,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar fechas:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron guardar las fechas y notificaciones',
          toast: true,
          position: 'top-end',
          timer: 3500,
          showConfirmButton: false
        });
      }
    });
  }


  // 🆕 Eliminar fechas y notificaciones
  deleteFechas(): void {
    this.clearDates();
  }

  clearDates(): void {
    if (typeof this.tareaId !== 'number') {
      console.error('❌ tareaId es undefined');
      return;
    }

    const tareaId = this.tareaId; // ← evitar TS2345

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar fechas?',
      text: 'Se eliminarán las fechas y la configuración de notificaciones',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#B3BAC5'
    }).then(result => {

      if (result.isConfirmed) {

        const updateData = {
          start_date: null,
          due_date: null,
          notifications_enabled: false,
          notification_days_before: null
        };

        this.tareaService.update(String(tareaId), updateData).subscribe({
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
              toast: true,
              position: 'top-end',
              timer: 2000,
              showConfirmButton: false
            });
          },

          error: (error) => {
            console.error('❌ Error al eliminar fechas:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron eliminar las fechas',
              toast: true,
              position: 'top-end',
              timer: 3500,
              showConfirmButton: false
            });
          }
        });

      }

    });
  }

}