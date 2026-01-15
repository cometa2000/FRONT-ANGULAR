import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';
import { GanttService, GanttFilters } from '../service/gantt.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GanttFiltersModalComponent } from '../gantt-filters-modal/gantt-filters-modal.component';

Chart.register(...registerables);

@Component({
  selector: 'app-gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss']
})
export class GanttChartComponent implements OnInit, OnDestroy {

  // ✅ CORREGIDO: Cambiar static: false para que se inicialice después de la vista
  @ViewChild('ganttCanvas', { static: false }) ganttCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  ganttData: any[] = [];
  stats: any = {};
  isLoading$: any;

  // ✅ Exponer Math para el template
  Math = Math;

  // 📅 Filtros actuales
  currentFilters: GanttFilters = {
    start_date: '',
    end_date: '',
    filter_type: 'all'
  };

  // 🎛️ Vista actual (día o semana)
  currentView: 'day' | 'week' = 'week';

  // 🎨 Configuración de colores
  statusColors: any = {
    'completada': '#10b981',
    'en_progreso': '#3b82f6',
    'pendiente': '#6b7280',
    'overdue': '#ef4444'
  };

  constructor(
    private ganttService: GanttService,
    private toast: ToastrService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef  // ✅ AGREGAR ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.ganttService.isLoading$;
    this.initializeDefaultFilters();
    this.loadGanttData();
  }

  /**
   * 🔧 Inicializar filtros por defecto (mes actual)
   */
  initializeDefaultFilters() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.currentFilters = {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
      filter_type: 'all'
    };
  }

  /**
   * 📊 Cargar datos del Gantt
   */
  loadGanttData() {
    this.ganttService.getGanttData(this.currentFilters).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.ganttData = resp.gantt_data || [];
          this.stats = resp.stats || {};
          
          console.log('✅ Datos del Gantt cargados:', this.ganttData);
          
          // ✅ CORREGIDO: Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.renderGanttChart();
          }, 0);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar datos del Gantt:', error);
        this.toast.error('Error al cargar el diagrama de Gantt', 'Error');
      }
    });
  }

  /**
   * 🎨 Renderizar gráfico de Gantt usando Chart.js
   */
  renderGanttChart() {
    // ✅ CORREGIDO: Verificar que ganttCanvas esté disponible
    if (!this.ganttCanvas || !this.ganttCanvas.nativeElement) {
      console.warn('⚠️ Canvas no disponible aún');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.ganttCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('❌ No se pudo obtener contexto del canvas');
      return;
    }

    // Si no hay datos, no renderizar
    if (this.ganttData.length === 0) {
      console.log('ℹ️ No hay datos para renderizar');
      return;
    }

    // ✅ Preparar datos correctamente para Chart.js
    const datasets = this.ganttData.map(task => {
      const startDate = new Date(task.start_date).getTime();
      const endDate = new Date(task.due_date).getTime();
      
      return {
        label: task.name,
        data: [{
          x: [startDate, endDate],
          y: task.name,
        }] as any,
        backgroundColor: task.is_overdue ? this.statusColors.overdue : task.color,
        borderColor: task.is_overdue ? this.statusColors.overdue : task.color,
        borderWidth: 2,
        borderSkipped: false as any,
        barThickness: 20,
        // Metadata adicional para tooltips
        task_id: task.id,
        status: task.status,
        priority: task.priority,
        grupo: task.grupo,
        progress: task.progress,
      } as any;
    });

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: this.ganttData.map(t => t.name),
        datasets: datasets as any
      },
      options: {
        indexAxis: 'y', // Barras horizontales
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.currentView === 'day' ? 'day' : 'week',
              displayFormats: {
                day: 'dd MMM',
                week: 'dd MMM'
              },
              tooltipFormat: 'dd MMM yyyy'
            },
            min: new Date(this.currentFilters.start_date).getTime(),
            max: new Date(this.currentFilters.end_date).getTime(),
            title: {
              display: true,
              text: 'Línea de Tiempo'
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tareas'
            },
            ticks: {
              autoSkip: false,
              font: {
                size: 11
              },
              callback: function(value: any, index: number) {
                const label = this.getLabelForValue(value as number);
                return label.length > 30 ? label.substring(0, 30) + '...' : label;
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: (context: any) => {
                const dataIndex = context[0].dataIndex;
                const task = this.ganttData[dataIndex];
                return task.name;
              },
              label: (context: any) => {
                const dataIndex = context.dataIndex;
                const task = this.ganttData[dataIndex];
                return [
                  `Estado: ${this.getStatusLabel(task.status)}`,
                  `Prioridad: ${this.getPriorityLabel(task.priority)}`,
                  `Progreso: ${task.progress}%`,
                  `Inicio: ${task.start_date}`,
                  `Fin: ${task.due_date}`,
                  `Grupo: ${task.grupo.name}`,
                  `Workspace: ${task.grupo.workspace_name}`
                ];
              },
              labelColor: (context: any) => {
                const dataIndex = context.dataIndex;
                const task = this.ganttData[dataIndex];
                return {
                  borderColor: task.color,
                  backgroundColor: task.color,
                  borderWidth: 2
                };
              }
            }
          }
        },
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const task = this.ganttData[dataIndex];
            this.onTaskClick(task);
          }
        }
      }
    };

    try {
      this.chart = new Chart(ctx, config);
      console.log('✅ Gráfico de Gantt renderizado correctamente');
    } catch (error) {
      console.error('❌ Error al crear el gráfico:', error);
      this.toast.error('Error al renderizar el gráfico', 'Error');
    }
  }

  /**
   * 🔄 Cambiar vista (día/semana)
   */
  toggleView(view: 'day' | 'week') {
    this.currentView = view;
    setTimeout(() => {
      this.renderGanttChart();
    }, 0);
  }

  /**
   * 🔧 Abrir modal de filtros
   */
  openFiltersModal() {
    const modalRef = this.modalService.open(GanttFiltersModalComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.currentFilters = { ...this.currentFilters };
    
    modalRef.result.then((filters: GanttFilters) => {
      if (filters) {
        this.currentFilters = filters;
        this.loadGanttData();
        this.toast.success('Filtros aplicados correctamente', 'Éxito');
      }
    }).catch(() => {
      // Modal cerrado sin aplicar
    });
  }

  /**
   * 🖱️ Manejar clic en tarea
   */
  onTaskClick(task: any) {
    console.log('📋 Tarea clickeada:', task);
    // Aquí puedes navegar al detalle de la tarea o abrir un modal
    this.toast.info(`Tarea: ${task.name}`, 'Información');
  }

  /**
   * 📅 Cambiar a mes actual
   */
  goToCurrentMonth() {
    this.initializeDefaultFilters();
    this.loadGanttData();
  }

  /**
   * ⬅️ Mes anterior
   */
  previousPeriod() {
    const start = new Date(this.currentFilters.start_date);
    start.setMonth(start.getMonth() - 1);
    
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    
    this.currentFilters.start_date = firstDay.toISOString().split('T')[0];
    this.currentFilters.end_date = lastDay.toISOString().split('T')[0];
    
    this.loadGanttData();
  }

  /**
   * ➡️ Mes siguiente
   */
  nextPeriod() {
    const start = new Date(this.currentFilters.start_date);
    start.setMonth(start.getMonth() + 1);
    
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    
    this.currentFilters.start_date = firstDay.toISOString().split('T')[0];
    this.currentFilters.end_date = lastDay.toISOString().split('T')[0];
    
    this.loadGanttData();
  }

  /**
   * 🏷️ Obtener etiqueta de estado
   */
  getStatusLabel(status: string): string {
    const labels: any = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada'
    };
    return labels[status] || status;
  }

  /**
   * 🏷️ Obtener etiqueta de prioridad
   */
  getPriorityLabel(priority: string): string {
    const labels: any = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta'
    };
    return labels[priority] || priority;
  }

  /**
   * 📅 Formatear rango de fechas para mostrar
   */
  getFormattedDateRange(): string {
    const start = new Date(this.currentFilters.start_date);
    const end = new Date(this.currentFilters.end_date);
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
  }

  /**
   * 🏷️ Obtener etiqueta del filtro actual
   */
  getCurrentFilterLabel(): string {
    switch (this.currentFilters.filter_type) {
      case 'all':
        return 'Todas mis tareas';
      case 'workspace':
        return 'Workspace específico';
      case 'grupo':
        return 'Grupo específico';
      case 'shared':
        return 'Tareas compartidas';
      default:
        return 'Filtro personalizado';
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}