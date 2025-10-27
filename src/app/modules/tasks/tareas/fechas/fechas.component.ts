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

  // formulario
  startDate: string = '';
  dueDate: string = '';

  // estado actual mostrado en la tarjeta
  currentStartDate: string = '';
  currentDueDate: string = '';
  hasDates: boolean = false;

  // flags que tu HTML usa
  enableDates: boolean = true;
  enableNotifications: boolean = false;

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

          // para abrir modal con lo actual
          this.startDate = this.currentStartDate || '';
          this.dueDate = this.currentDueDate || '';

          // enableDates en función de si hay fechas cargadas
          this.enableDates = this.hasDates;
        }
      },
      error: (error) => {
        console.error('Error al cargar fechas:', error);
      }
    });
  }

  openModal(): void {
    this.showModal = true;
    // sincronizamos el formulario con el estado actual
    this.startDate = this.currentStartDate || new Date().toISOString().split('T')[0];
    this.dueDate = this.currentDueDate || '';
    this.enableDates = !!(this.currentStartDate || this.currentDueDate);
  }

  closeModal(): void {
    this.showModal = false;
  }

  // Helpers que llama el HTML
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // si viene en formato raro, lo mostramos tal cual
    return d.toLocaleDateString();
  }

  isOverdue(): boolean {
    if (!this.currentDueDate) return false;
    const today = new Date();
    const due = new Date(this.currentDueDate);
    if (isNaN(due.getTime())) return false;
    // vencida si la fecha de vencimiento < hoy (sin horas)
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

  // Guardar (alias que pide el HTML)
  saveFechas(): void {
    this.saveDates();
  }

  saveDates(): void {
    if (!this.tareaId) return;

    const updateData: any = this.enableDates
      ? {
          start_date: this.startDate || null,
          due_date: this.dueDate || null
        }
      : {
          start_date: null,
          due_date: null
        };

    this.tareaService.update(String(this.tareaId!), updateData).subscribe({
      next: (resp: any) => {
        this.currentStartDate = resp.tarea?.start_date ?? (this.enableDates ? (this.startDate || '') : '');
        this.currentDueDate = resp.tarea?.due_date ?? (this.enableDates ? (this.dueDate || '') : '');
        this.hasDates = !!(this.currentStartDate || this.currentDueDate);
        this.closeModal();
        this.fechasActualizadas.emit(resp.tarea);
        Swal.fire({
          icon: 'success',
          title: 'Fechas guardadas',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al guardar fechas:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron guardar las fechas',
          confirmButtonColor: '#EB5A46'
        });
      }
    });
  }

  // Eliminar (alias que pide el HTML)
  deleteFechas(): void {
    this.clearDates();
  }

  clearDates(): void {
    if (!this.tareaId) return;

    Swal.fire({
      title: '¿Eliminar fechas?',
      text: '¿Estás seguro de eliminar las fechas de esta tarea?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#B3BAC5',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const updateData = { start_date: null, due_date: null };

        this.tareaService.update(String(this.tareaId!), updateData).subscribe({
          next: (resp: any) => {
            this.hasDates = false;
            this.currentStartDate = '';
            this.currentDueDate = '';
            this.closeModal();
            this.fechasActualizadas.emit(resp.tarea);
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
