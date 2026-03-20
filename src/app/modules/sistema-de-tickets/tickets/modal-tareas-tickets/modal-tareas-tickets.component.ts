import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService, TareaDisponible } from '../service/tickets.service';

@Component({
  selector: 'app-modal-tareas-tickets',
  templateUrl: './modal-tareas-tickets.component.html',
  styleUrls: ['./modal-tareas-tickets.component.scss'],
})
export class ModalTareasTicketsComponent implements OnInit {

  /** Emite el array de tareas seleccionadas al componente padre */
  @Output() TareasSeleccionadas = new EventEmitter<TareaDisponible[]>();

  tareas: TareaDisponible[] = [];
  tareasFiltradas: TareaDisponible[] = [];

  isLoading = true;
  errorMsg: string | null = null;

  searchText = '';
  filtroStatus = '';

  /** IDs de tareas marcadas en el modal (selección múltiple) */
  selectedIds: Set<number> = new Set();

  readonly statusOptions = [
    { value: '',            label: 'Todos los estados' },
    { value: 'pendiente',   label: 'Pendiente'         },
    { value: 'en_progreso', label: 'En progreso'       },
    { value: 'completada',  label: 'Completada'        },
  ];

  constructor(
    public modal: NgbActiveModal,
    public ticketsService: TicketsService,
  ) {}

  ngOnInit(): void {
    this.cargarTareas();
  }

  cargarTareas(): void {
    this.isLoading = true;
    this.errorMsg  = null;

    this.ticketsService.getTareasDisponibles().subscribe({
      next: (resp) => {
        this.tareas         = resp.tareas ?? [];
        this.tareasFiltradas = [...this.tareas];
        this.isLoading       = false;
      },
      error: () => {
        this.errorMsg  = 'No se pudieron cargar las tareas. Intenta de nuevo.';
        this.isLoading = false;
      },
    });
  }

  // ── Filtrado ─────────────────────────────────────────────────────

  aplicarFiltros(): void {
    const q = this.searchText.toLowerCase().trim();
    this.tareasFiltradas = this.tareas.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.grupo_name ?? '').toLowerCase().includes(q) ||
        (t.lista_name ?? '').toLowerCase().includes(q);

      const matchStatus = !this.filtroStatus || t.status === this.filtroStatus;

      return matchSearch && matchStatus;
    });
  }

  // ── Selección ────────────────────────────────────────────────────

  toggleSeleccion(tarea: TareaDisponible): void {
    if (this.selectedIds.has(tarea.id)) {
      this.selectedIds.delete(tarea.id);
    } else {
      this.selectedIds.add(tarea.id);
    }
  }

  isSeleccionada(tarea: TareaDisponible): boolean {
    return this.selectedIds.has(tarea.id);
  }

  // ── Confirmar ────────────────────────────────────────────────────

  confirmar(): void {
    const seleccionadas = this.tareas.filter((t) => this.selectedIds.has(t.id));
    if (seleccionadas.length === 0) return;
    this.TareasSeleccionadas.emit(seleccionadas);
    this.modal.close();
  }

  // ── Helpers de presentación ──────────────────────────────────────

  getStatusClass(status: string): string {
    return this.ticketsService.getTareaStatusClass(status);
  }

  getStatusLabel(status: string): string {
    return this.ticketsService.getTareaStatusLabel(status);
  }

  getPriorityClass(priority: string): string {
    return this.ticketsService.getTareaPriorityClass(priority);
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-success';
    if (progress >= 40) return 'bg-warning';
    return 'bg-danger';
  }
}