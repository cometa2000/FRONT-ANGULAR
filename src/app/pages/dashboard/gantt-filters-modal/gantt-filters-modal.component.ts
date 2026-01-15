import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GanttService, GanttFilters } from '../service/gantt.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-gantt-filters-modal',
  templateUrl: './gantt-filters-modal.component.html',
  styleUrls: ['./gantt-filters-modal.component.scss']
})
export class GanttFiltersModalComponent implements OnInit {

  @Input() currentFilters!: GanttFilters;

  // Opciones de filtrado
  workspaces: any[] = [];
  grupos: any[] = [];
  filteredGrupos: any[] = [];

  // Formulario
  filters: GanttFilters = {
    start_date: '',
    end_date: '',
    filter_type: 'all'
  };

  isLoading$: any;

  constructor(
    public activeModal: NgbActiveModal,
    private ganttService: GanttService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.ganttService.isLoading$;
    
    // Copiar filtros actuales
    if (this.currentFilters) {
      this.filters = { ...this.currentFilters };
    }
    
    this.loadFilterOptions();
  }

  /**
   * 📋 Cargar opciones de filtrado (workspaces y grupos)
   */
  loadFilterOptions() {
    this.ganttService.getFilterOptions().subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.workspaces = resp.workspaces || [];
          this.grupos = resp.grupos || [];
          this.filteredGrupos = [...this.grupos];
          
          console.log('✅ Opciones de filtrado cargadas:', {
            workspaces: this.workspaces.length,
            grupos: this.grupos.length
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar opciones:', error);
        this.toast.error('Error al cargar opciones de filtrado', 'Error');
      }
    });
  }

  /**
   * 🔄 Cambio en tipo de filtro
   */
  onFilterTypeChange() {
    // Resetear filter_id cuando cambia el tipo
    if (this.filters.filter_type === 'all' || this.filters.filter_type === 'shared') {
      delete this.filters.filter_id;
    }
    
    // Filtrar grupos por workspace si es necesario
    this.updateFilteredGrupos();
  }

  /**
   * 🔄 Cambio en workspace seleccionado
   */
  onWorkspaceChange(workspaceId: number) {
    this.filters.filter_id = workspaceId;
    this.updateFilteredGrupos();
  }

  /**
   * 🔍 Actualizar lista de grupos filtrados
   */
  updateFilteredGrupos() {
    if (this.filters.filter_type === 'workspace' && this.filters.filter_id) {
      // Filtrar grupos del workspace seleccionado
      this.filteredGrupos = this.grupos.filter(g => g.workspace_id === this.filters.filter_id);
    } else {
      // Mostrar todos los grupos
      this.filteredGrupos = [...this.grupos];
    }
  }

  /**
   * ✅ Aplicar filtros
   */
  applyFilters() {
    // Validar fechas
    if (!this.filters.start_date || !this.filters.end_date) {
      this.toast.warning('Debes seleccionar un rango de fechas', 'Advertencia');
      return;
    }

    const startDate = new Date(this.filters.start_date);
    const endDate = new Date(this.filters.end_date);

    if (startDate > endDate) {
      this.toast.warning('La fecha inicial no puede ser mayor que la final', 'Advertencia');
      return;
    }

    // Validar que si el tipo requiere ID, esté presente
    if ((this.filters.filter_type === 'workspace' || this.filters.filter_type === 'grupo') 
        && !this.filters.filter_id) {
      this.toast.warning('Debes seleccionar un workspace o grupo', 'Advertencia');
      return;
    }

    console.log('✅ Aplicando filtros:', this.filters);
    this.activeModal.close(this.filters);
  }

  /**
   * 📅 Establecer periodo predefinido
   */
  setPresetPeriod(period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'week':
        // Semana actual
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;

      case 'month':
        // Mes actual
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;

      case 'quarter':
        // Trimestre actual
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;

      case 'year':
        // Año actual
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    this.filters.start_date = start.toISOString().split('T')[0];
    this.filters.end_date = end.toISOString().split('T')[0];
  }

  /**
   * 🔄 Resetear filtros
   */
  resetFilters() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.filters = {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      filter_type: 'all'
    };

    this.filteredGrupos = [...this.grupos];
  }

  /**
   * ❌ Cerrar modal
   */
  closeModal() {
    this.activeModal.dismiss();
  }
} 