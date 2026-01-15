import { Component, Input, OnInit, EventEmitter, Output, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TareaService } from '../service/tarea.service';
import { ChecklistsService } from '../service/checklists.service';
import { EtiquetasService, Etiqueta } from '../service/etiquetas.service';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdjuntarModalComponent, Enlace, Archivo } from '../adjuntar-modal/adjuntar-modal.component';
import { AssignMembersTareaComponent } from '../assign-members-tarea/assign-members-tarea.component';
import { GrupoService } from '../../grupos/service/grupo.service';
import { ToastrService } from 'ngx-toastr';
import { FechasComponent } from '../fechas/fechas.component';


export interface Tarea {
  id: number;
  name: string;
  description: string | null;
  status: 'pendiente' | 'en_progreso' | 'completada' | string;
  grupo_id: number;
  created_at?: string;
  updated_at?: string;
  type_task?: string | null;
  priority?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  notifications_enabled?: boolean;           
  notification_days_before?: number;         
  etiquetas?: any[];
  checklists?: any[];
  comentarios?: any[];
  user?: any;
  lista?: any;
  grupo?: any;
  is_overdue?: boolean;
  is_due_soon?: boolean;
  total_checklist_progress?: number;
  total_checklist_items?: number;
  completed_checklist_items?: number;
  adjuntos?: {
    enlaces: Enlace[];
    archivos: Archivo[];
  };
  assigned_members?: any[];  // 🆕 AGREGADO: Miembros asignados a la tarea

  
}

@Component({
  selector: 'app-edit-tarea',
  templateUrl: './edit-tarea.component.html',
  styleUrls: ['./edit-tarea.component.scss']
})
export class EditTareaComponent implements OnInit {

  @Input() TAREA_SELECTED?: { id: number };
  @Input() users: any[] = [];
  @Input() grupo_id?: number;
  @Output() TareaE = new EventEmitter<any>();

  tareaId!: number;
  tarea: Tarea | null = null;

  // UI helpers
  defaultAvatar = 'assets/media/avatars/blank.png';
  sectionsOpen = {
    descripcion: true,
    etiquetas: true,
    checklists: true,
    comentarios: true,
    actividad: true,
    miembros: true
  };

  // ADJUNTOS
  adjuntos: {
    enlaces: Enlace[];
    archivos: Archivo[];
  } = {
    enlaces: [],
    archivos: []
  };

  // Propiedades para edición
  editingDescription = false;
  newComment = '';
  timeline: any[] = [];

  // ✅ NUEVO: Propiedades para edición de comentarios
  editingCommentId: number | null = null;
  editingCommentContent: string = '';

  // Propiedades para edición de fechas
  editingFechas = false;
  startDate: string = '';
  dueDate: string = '';

  // Propiedades para edición de etiquetas
  editingEtiqueta: Etiqueta | null = null;
  showEtiquetaModal = false;
  etiquetaName: string = '';
  selectedColor: string = '#61BD4F';
  colorOptions = [
    { name: 'Verde', value: '#61BD4F' },
    { name: 'Amarillo', value: '#F2D600' },
    { name: 'Naranja', value: '#FF9F1A' },
    { name: 'Rojo', value: '#EB5A46' },
    { name: 'Morado', value: '#C377E0' },
    { name: 'Azul', value: '#0079BF' },
    { name: 'Celeste', value: '#00C2E0' },
    { name: 'Lima', value: '#51E898' },
    { name: 'Rosa', value: '#FF78CB' },
    { name: 'Gris', value: '#B3BAC5' },
    { name: 'Negro', value: '#344563' }
  ];


  miembrosAsignados: any[] = [];

  hasWriteAccess: boolean = true;
  isOwner: boolean = false;
  permissionLevel: string = 'write';
  isReadOnly: boolean = false;  

  @ViewChild(FechasComponent) fechasComponent?: FechasComponent;

  showEditarFechasModal: boolean = false;
  editFechasStartDate: string = '';
  editFechasDueDate: string = '';
  editFechasEnableNotifications: boolean = false;
  editFechasNotificationDays: number = 1;

  constructor(
    public modal: NgbActiveModal,
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private checklistsService: ChecklistsService,
    private etiquetasService: EtiquetasService,
    private modalService: NgbModal,
    private grupoService: GrupoService,
    private toastr: ToastrService,      
  private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    console.log('🎯 Iniciando EditTareaComponent');
    
    if (this.TAREA_SELECTED?.id) {
      this.tareaId = Number(this.TAREA_SELECTED.id);
      console.log('📌 ID desde @Input:', this.tareaId);
    } else {
      const idFromRoute = this.route.snapshot.paramMap.get('id');
      this.tareaId = idFromRoute ? Number(idFromRoute) : NaN;
      console.log('📌 ID desde ruta:', this.tareaId);
    }

    if (!Number.isFinite(this.tareaId)) {
      console.error('❌ ID de tarea no válido:', this.tareaId);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Falta el identificador de la tarea.',
        confirmButtonColor: '#EB5A46'
      });
      return;
    }

    console.log('✅ ID válido, cargando tarea:', this.tareaId);
    this.loadTarea();
    this.loadTimeline();
    this.checkWritePermissions();
  }

  toggleDescriptionEdit(): void {
    if (this.isReadOnly) {
      this.toastr.warning('No tienes permisos para editar esta tarea', 'Permiso denegado');
      return;
    }
    this.editingDescription = !this.editingDescription;
  }

  checkWritePermissions() {
    // Verificar si tenemos grupo_id disponible
    if (!this.grupo_id) {
      console.warn('⚠️ No se proporcionó grupo_id al componente');
      this.hasWriteAccess = false;
      return;
    }
    
    console.log('🔍 Verificando permisos para grupo:', this.grupo_id);
    
    this.grupoService.checkWriteAccess(this.grupo_id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.hasWriteAccess = resp.has_write_access;
          this.isOwner = resp.is_owner;
          
          console.log('✅ Permisos cargados:', {
            hasWriteAccess: this.hasWriteAccess,
            isOwner: this.isOwner,
            permissionLevel: resp.permission_level
          });
          
          // Si es solo lectura, mostrar mensaje
          if (!this.hasWriteAccess && !this.isOwner) {
            console.log('👁️ Usuario tiene solo permisos de lectura');
          }
        }
      },
      error: (err) => {
        console.error('❌ Error al verificar permisos:', err);
        this.hasWriteAccess = false;
        // No mostrar toast aquí para no molestar al usuario
      }
    });
  }

  /**
   * Verificar si la tarea tiene fechas configuradas
   */
  hasFechas(): boolean {
    return !!(this.tarea?.start_date || this.tarea?.due_date);
  }

  /**
   * Verificar si la tarea tiene adjuntos
   */
  tieneAdjuntos(): boolean {
    return (this.adjuntos.archivos.length > 0 || this.adjuntos.enlaces.length > 0);
  }

  /**
   * Callback cuando se actualizan las fechas
   */
  onFechasActualizadas(tarea: any): void {
    console.log('📅 Fechas actualizadas, refrescando tarea:', tarea);
    
    if (this.tarea && tarea) {
      this.tarea.start_date = tarea.start_date;
      this.tarea.due_date = tarea.due_date;
      this.tarea.notifications_enabled = tarea.notifications_enabled;
      this.tarea.notification_days_before = tarea.notification_days_before;
      this.tarea.is_overdue = tarea.is_overdue;
      this.tarea.is_due_soon = tarea.is_due_soon;
      this.cdr.detectChanges();
    }
    
    this.loadTimeline();
    this.TareaE.emit(this.tarea);
  }

  /**
   * Callback cuando se actualizan las etiquetas
   */
  onEtiquetasChanged(): void {
    console.log('🏷️ Etiquetas actualizadas, refrescando tarea');
    this.loadTarea();
  }

  /**
   * Callback cuando se actualizan los checklists
   */
  onChecklistsChanged(): void {
    console.log('✅ Checklists actualizados, refrescando tarea');
    this.loadTarea();
  }
  

  loadAdjuntos(): void {
    console.log('📎 Cargando adjuntos de la tarea:', this.tareaId);
    
    this.tareaService.show(this.tareaId.toString()).subscribe({
      next: (resp: any) => {
        if (resp.message === 200 && resp.tarea?.adjuntos) {
          this.adjuntos = resp.tarea.adjuntos;
          console.log('✅ Adjuntos cargados:', this.adjuntos);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar adjuntos:', error);
        this.adjuntos = { enlaces: [], archivos: [] };
      }
    });
  }

  

  // =============================
  // 🧱 CARGA DE TAREA
  // =============================
  

  loadTarea() {
    console.log('🔄 Cargando tarea con ID:', this.tareaId);
    
    this.tareaService.show(this.tareaId.toString()).subscribe({
      next: (resp: any) => {
        console.log('✅ Tarea cargada:', resp);
        
        if (resp.message === 200 && resp.tarea) {
          this.tarea = resp.tarea;
          
          // ⭐ AGREGAR ESTA LÍNEA
          this.loadAdjuntos();
          
          // Cargar miembros asignados
          this.loadMiembrosAsignados();
          
          // Cargar timeline
          this.loadTimeline();
          
          // Forzar detección de cambios
          this.cdr.detectChanges();
          
          console.log('📋 Tarea completa:', this.tarea);
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar tarea:', error);
      }
    });
  }

  // =============================
  // 📅 ESTADO DE LA TAREA
  // =============================
  updateStatus(): void {
    if (!this.tarea) return;

    this.tareaService.updateTarea(this.tareaId, { status: this.tarea.status }).subscribe({
      next: () => {
        this.TareaE.emit(this.tarea);

        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  // =============================
  // ✏️ DESCRIPCIÓN
  // =============================
  toggleEditDescription(): void {
    this.editingDescription = true;
  }

  cancelEditDescription(): void {
    this.editingDescription = false;
    if (this.tarea) {
      this.loadTarea();
    }
  }

  saveDescription(): void {
    if (!this.tarea) return;

    this.tareaService.updateTarea(this.tareaId, { description: this.tarea.description }).subscribe({
      next: () => {
        this.editingDescription = false;
        this.TareaE.emit(this.tarea);

        Swal.fire({
          icon: 'success',
          title: 'Descripción guardada',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al guardar descripción:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la descripción',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  // =============================
  // 📅 FECHAS - CORRECCIÓN APLICADA
  // =============================
  
  /**
   * 🔧 CORRECCIÓN 1: Convertir fechas del backend a formato datetime-local
   */
  toggleEditFechas(): void {
    this.editingFechas = true;
    
    // Convertir fechas del backend (ISO 8601) a formato datetime-local (YYYY-MM-DDTHH:mm)
    if (this.tarea?.start_date) {
      this.startDate = this.convertirFechaParaInput(this.tarea.start_date);
    }
    if (this.tarea?.due_date) {
      this.dueDate = this.convertirFechaParaInput(this.tarea.due_date);
    }
    
    console.log('📅 Fechas cargadas para edición:', {
      start: this.startDate,
      due: this.dueDate
    });
  }

  /**
   * Convierte una fecha ISO 8601 a formato datetime-local
   * Ejemplo: "2024-11-15T14:30:00.000000Z" → "2024-11-15T14:30"
   */
  convertirFechaParaInput(fecha: string): string {
    if (!fecha) return '';
    
    try {
      const date = new Date(fecha);
      
      // Obtener componentes de la fecha en zona horaria local
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // Formato datetime-local: "YYYY-MM-DDTHH:mm"
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('❌ Error al convertir fecha:', error);
      return '';
    }
  }

  cancelEditFechas(): void {
    this.editingFechas = false;
    this.startDate = '';
    this.dueDate = '';
  }

  saveFechas(): void {
    if (!this.dueDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Debes ingresar al menos la fecha de vencimiento',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const data: any = { due_date: this.dueDate };
    if (this.startDate) data.start_date = this.startDate;

    this.tareaService.updateTarea(this.tareaId, data).subscribe({
      next: () => {
        this.editingFechas = false;

        if (this.tarea) {
          this.tarea.due_date = this.dueDate;
          if (this.startDate) this.tarea.start_date = this.startDate;

          this.cdr.detectChanges();
          this.TareaE.emit(this.tarea);
        }

        this.loadTarea();

        Swal.fire({
          icon: 'success',
          title: 'Fechas guardadas',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al guardar fechas:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron guardar las fechas',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  deleteFechas(): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar fechas?',
      text: 'Se eliminarán las fechas de inicio y vencimiento',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {
        const data = { start_date: null, due_date: null };

        this.tareaService.updateTarea(this.tareaId, data).subscribe({
          next: () => {
            this.loadTarea();
            this.TareaE.emit(this.tarea);

            Swal.fire({
              icon: 'success',
              title: 'Fechas eliminadas',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.loadTimeline();
          },
          error: (error) => {
            console.error('❌ Error al eliminar fechas:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron eliminar las fechas',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });
      }

    });
  }


  // =============================
  // 🏷️ ETIQUETAS
  // =============================
  
  openEditEtiquetaModal(etiqueta: Etiqueta): void {
    this.editingEtiqueta = etiqueta;
    this.etiquetaName = etiqueta.name;
    this.selectedColor = etiqueta.color;
    this.showEtiquetaModal = true;
  }

  closeEtiquetaModal(): void {
    this.showEtiquetaModal = false;
    this.editingEtiqueta = null;
    this.etiquetaName = '';
    this.selectedColor = '#61BD4F';
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  updateEtiqueta(): void {
    if (!this.etiquetaName.trim() || !this.editingEtiqueta?.id) return;

    const data = {
      name: this.etiquetaName.trim(),
      color: this.selectedColor
    };

    this.etiquetasService.updateEtiqueta(this.tareaId, this.editingEtiqueta.id, data).subscribe({
      next: () => {
        this.closeEtiquetaModal();
        this.loadTarea();
        this.TareaE.emit(this.tarea);

        Swal.fire({
          icon: 'success',
          title: 'Etiqueta actualizada',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al actualizar etiqueta:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la etiqueta',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  deleteEtiqueta(etiqueta: Etiqueta): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar etiqueta?',
      text: `Se eliminará la etiqueta "${etiqueta.name}"`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed && typeof etiqueta.id === 'number') {

        this.etiquetasService.deleteEtiqueta(this.tareaId, etiqueta.id).subscribe({
          next: () => {
            this.loadTarea();
            this.TareaE.emit(this.tarea);

            Swal.fire({
              icon: 'success',
              title: 'Etiqueta eliminada',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.loadTimeline();
          },
          error: (error) => {
            console.error('❌ Error al eliminar etiqueta:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la etiqueta',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });

      }

    });
  }


  getEtiquetaColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#61BD4F': 'green',
      '#F2D600': 'yellow',
      '#FF9F1A': 'orange',
      '#EB5A46': 'red',
      '#C377E0': 'purple',
      '#0079BF': 'blue',
      '#00C2E0': 'sky',
      '#51E898': 'lime',
      '#FF78CB': 'pink',
      '#B3BAC5': 'gray',
      '#344563': 'black'
    };
    return colorMap[color] || 'green';
  }

  // =============================
  // ✅ CHECKLISTS - CORRECCIÓN APLICADA
  // =============================
  
  getChecklistProgress(checklist: any): number {
    if (!checklist || !checklist.items || checklist.items.length === 0) {
      return 0;
    }
    
    const completedItems = checklist.items.filter((item: any) => item.completed).length;
    const totalItems = checklist.items.length;
    
    return Math.round((completedItems / totalItems) * 100);
  }

  /**
   * 🔧 CORRECCIÓN 2: Arreglar el toggle de checkbox
   * Cambiar para que reciba solo IDs y obtenga el item correctamente
   */
  toggleChecklistItem(checklistId: number, itemId: number): void {
    console.log('🔄 Cambiando estado de item:', { checklistId, itemId });
    
    // Encontrar el checklist
    const checklist = this.tarea?.checklists?.find((c: any) => c.id === checklistId);
    if (!checklist) {
      console.error('❌ Checklist no encontrado');
      return;
    }

    // Encontrar el item dentro del checklist
    const item = checklist.items?.find((i: any) => i.id === itemId);
    if (!item) {
      console.error('❌ Item no encontrado');
      return;
    }

    // Guardar el estado actual antes de cambiar
    const estadoActual = item.completed;
    const nuevoEstado = !estadoActual;
    
    console.log('🔄 Estado actual:', estadoActual, '→ Nuevo estado:', nuevoEstado);
    
    // Actualizar en el servidor
    this.checklistsService.updateItem(this.tareaId, checklistId, itemId, {
      completed: nuevoEstado
    }).subscribe({
      next: (resp) => {
        console.log('✅ Item actualizado correctamente:', resp);
        
        // Actualizar el estado local del item
        item.completed = nuevoEstado;
        
        // Recalcular el progreso del checklist
        if (checklist.items && checklist.items.length > 0) {
          const completed = checklist.items.filter((i: any) => i.completed).length;
          checklist.progress = Math.round((completed / checklist.items.length) * 100);
        }
        
        // Emitir evento de cambio
        this.TareaE.emit(this.tarea);
        
        // Recargar timeline para registrar la actividad
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar item:', error);
        
        // Revertir el cambio visual si falló
        item.completed = estadoActual;
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el elemento'
        });
      }
    });
  }

  deleteChecklist(checklistId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar checklist?',
      text: 'Se eliminarán todos los elementos del checklist',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {

        this.checklistsService.deleteChecklist(this.tareaId, checklistId).subscribe({
          next: () => {
            this.loadTarea();
            this.TareaE.emit(this.tarea);

            Swal.fire({
              icon: 'success',
              title: 'Checklist eliminado',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.loadTimeline();
          },
          error: (error) => {
            console.error('❌ Error al eliminar checklist:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el checklist',
              timer: 3500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        });

      }

    });
  }


  deleteChecklistItem(checklistId: number, itemId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar elemento?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {

        this.checklistsService.deleteItem(this.tareaId, checklistId, itemId).subscribe({
          next: () => {
            this.loadTarea();
            this.TareaE.emit(this.tarea);

            Swal.fire({
              icon: 'success',
              title: 'Elemento eliminado',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.loadTimeline();
          },
          error: (error) => {
            console.error('❌ Error al eliminar item:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el elemento',
              timer: 3500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        });

      }
    });
  }


  showAddItemInput(checklist: any): void {
    checklist.addingItem = true;
    checklist.newItemName = '';
  }

  cancelAddItem(checklist: any): void {
    checklist.addingItem = false;
    checklist.newItemName = '';
  }

  addChecklistItem(checklist: any): void {
    if (!checklist.newItemName || !checklist.newItemName.trim()) return;

    this.checklistsService.addItem(this.tareaId, checklist.id, {
      name: checklist.newItemName.trim(),
      completed: false
    }).subscribe({
      next: () => {
        checklist.addingItem = false;
        checklist.newItemName = '';
        this.loadTarea();
        this.TareaE.emit(this.tarea);

        Swal.fire({
          icon: 'success',
          title: 'Elemento agregado',
          timer: 1200,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });

        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al agregar item:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar el elemento',
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  // =============================
  // 📎 ADJUNTOS - CORRECCIÓN APLICADA
  // =============================
  
  abrirModalAdjuntar(): void {
    const modalRef = this.modalService.open(AdjuntarModalComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance.adjuntosExistentes = this.adjuntos;

    modalRef.componentInstance.adjuntoAgregado.subscribe((resultado: { enlaces: Enlace[], archivos: Archivo[] }) => {
      if (resultado.enlaces.length > 0) {
        this.guardarEnlace(resultado.enlaces[0]);
      }
      if (resultado.archivos.length > 0) {
        this.guardarArchivo(resultado.archivos[0]);
      }
    });
  }

  /**
   * 🔧 CORRECCIÓN 4: Mejorar la subida de archivos (especialmente imágenes)
   */
  guardarArchivo(archivo: Archivo): void {
    if (!archivo.file) {
      console.error('❌ No hay archivo para subir');
      return;
    }

    const formData = new FormData();
    formData.append('tipo', 'archivo');
    formData.append('file', archivo.file);

    this.tareaService.addAdjunto(this.tareaId, formData).subscribe({
      next: (resp: any) => {
        this.loadAdjuntos();
        this.loadTimeline();
        
        Swal.fire({
          icon: 'success',
          title: 'Archivo subido',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('❌ Error al subir archivo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo subir el archivo',
          timer: 3500,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }



  guardarEnlace(enlace: Enlace): void {
    const data = {
      tipo: 'enlace',
      nombre: enlace.nombre,
      url: enlace.url
    };

    this.tareaService.addAdjunto(this.tareaId, data).subscribe({
      next: (resp: any) => {
        this.loadAdjuntos();
        this.loadTimeline();
        
        Swal.fire({
          icon: 'success',
          title: 'Enlace agregado',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar enlace:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el enlace',
          timer: 3500,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  /**
   * 🔧 CORRECCIÓN 3: Agregar método para descargar archivos
   */
  descargarArchivo(archivo: Archivo): void {
    if (archivo.file_url) {
      window.open(archivo.file_url, '_blank');
    }
  }

  abrirEnlace(url: string): void {
    window.open(url, '_blank');
  }

  eliminarEnlace(enlaceId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar enlace?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {
      if (result.isConfirmed) {
        this.tareaService.deleteAdjunto(this.tareaId, enlaceId).subscribe({
          next: () => {
            this.loadAdjuntos();
            this.loadTimeline();
            
            Swal.fire({
              icon: 'success',
              title: 'Enlace eliminado',
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar enlace:', error);
          }
        });
      }
    });
  }

  eliminarArchivo(archivoId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {
      if (result.isConfirmed) {
        this.tareaService.deleteAdjunto(this.tareaId, archivoId).subscribe({
          next: () => {
            this.loadAdjuntos();
            this.loadTimeline();
            
            Swal.fire({
              icon: 'success',
              title: 'Archivo eliminado',
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar archivo:', error);
          }
        });
      }
    });
  }


  obtenerIconoArchivo(tipo: string): string {
    if (!tipo) return 'fa-file';
    
    if (tipo.startsWith('image/')) return 'fa-file-image';
    if (tipo === 'application/pdf') return 'fa-file-pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'fa-file-excel';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'fa-file-powerpoint';
    if (tipo === 'text/plain') return 'fa-file-alt';
    if (tipo === 'text/csv') return 'fa-file-csv';
    
    return 'fa-file';
  }

  /**
   * 🔧 CORRECCIÓN: Verificar si un archivo puede ser visualizado
   */
  esArchivoVisualizable(archivo: Archivo): boolean {
    if (!archivo.tipo) return false;
    
    const tiposVisualizables = [
      'image/',
      'application/pdf'
    ];
    
    return tiposVisualizables.some(tipo => archivo.tipo.startsWith(tipo));
  }

  /**
   * 🔧 CORRECCIÓN: Visualizar archivo en modal o nueva ventana
   */
  visualizarArchivo(archivo: Archivo): void {
    if (archivo.file_url) {
      window.open(archivo.file_url, '_blank');
    }
  }

  // =============================
  // 💬 COMENTARIOS Y TIMELINE
  // =============================
  loadTimeline(): void {
    console.log('📜 Cargando timeline para tarea:', this.tareaId);
    
    this.tareaService.getTimeline(this.tareaId).subscribe({
      next: (resp) => {
        console.log('✅ Timeline cargado:', resp);
        this.timeline = resp?.timeline || [];
      },
      error: (error: any) => {
        console.error('❌ Error al cargar timeline:', error);
        this.timeline = [];
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;

    this.tareaService.addComment(this.tareaId, this.newComment).subscribe({
      next: () => {
        this.newComment = '';
        this.loadTimeline();

        Swal.fire({
          icon: 'success',
          title: 'Comentario agregado',
          timer: 1500,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
      },

      error: (error) => {
        console.error('❌ Error al agregar comentario:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar el comentario',
          timer: 3500,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * ✅ NUEVO: Verificar si un comentario pertenece al usuario actual
   */
  isOwnComment(comment: any): boolean {
    if (!comment || !comment.user || !comment.user.id) {
      return false;
    }
    
    // Obtener el ID del usuario autenticado
    const currentUserId = this.tareaService.authservice.user?.id;
    
    if (!currentUserId) {
      return false;
    }
    
    return comment.user.id === currentUserId;
  }

  /**
   * ✅ NUEVO: Verificar si un comentario está en modo de edición
   */
  isEditingComment(commentId: number): boolean {
    return this.editingCommentId === commentId;
  }

  /**
   * ✅ NUEVO: Iniciar edición de un comentario
   * Activa el modo de edición inline para el comentario seleccionado
   */
  editComment(commentId: number): void {
    console.log('✏️ Iniciando edición de comentario:', commentId);
    
    // Buscar el comentario en el timeline
    const comment = this.timeline.find(item => item.id === commentId && item.type === 'comentario');
    
    if (!comment) {
      console.error('❌ Comentario no encontrado en el timeline');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo encontrar el comentario',
        timer: 2000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      return;
    }
    
    // Verificar que sea el propietario
    if (!this.isOwnComment(comment)) {
      console.warn('⚠️ Intento de editar comentario ajeno');
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'Solo puedes editar tus propios comentarios',
        timer: 2000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      return;
    }
    
    // Activar modo de edición
    this.editingCommentId = commentId;
    this.editingCommentContent = comment.content;
    
    console.log('📝 Modo de edición activado para comentario:', commentId);
  }

  /**
   * ✅ NUEVO: Guardar los cambios de un comentario editado
   */
  saveCommentEdit(commentId: number): void {
    console.log('💾 Guardando edición de comentario:', commentId);
    
    // Validar contenido
    if (!this.editingCommentContent || !this.editingCommentContent.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Contenido vacío',
        text: 'El comentario no puede estar vacío',
        timer: 2000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      return;
    }
    
    // Llamar al servicio para actualizar
    this.tareaService.updateComment(this.tareaId, commentId, this.editingCommentContent.trim()).subscribe({
      next: (resp: any) => {
        console.log('✅ Comentario actualizado:', resp);
        
        if (resp.message === 200 && resp.comentario) {
          // Actualizar el comentario en el timeline local
          const commentIndex = this.timeline.findIndex(item => item.id === commentId);
          if (commentIndex !== -1) {
            this.timeline[commentIndex] = {
              ...this.timeline[commentIndex],
              content: resp.comentario.content,
              updated_at: resp.comentario.updated_at,
              is_edited: resp.comentario.is_edited || true
            };
          }
          
          // Desactivar modo de edición
          this.cancelCommentEdit();
          
          // Mostrar mensaje de éxito
          Swal.fire({
            icon: 'success',
            title: 'Comentario actualizado',
            timer: 1500,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
          
          // Recargar timeline para asegurar sincronización
          this.loadTimeline();
        }
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar comentario:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.userMessage || 'No se pudo actualizar el comentario',
          timer: 3500,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * ✅ NUEVO: Cancelar edición de comentario
   */
  cancelCommentEdit(): void {
    console.log('🚫 Cancelando edición de comentario');
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  deleteComment(commentId: number): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar comentario?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {

        this.tareaService.deleteComment(this.tareaId, commentId).subscribe({
          next: () => {
            this.loadTimeline();

            Swal.fire({
              icon: 'success',
              title: 'Comentario eliminado',
              timer: 1500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          },

          error: (error) => {
            console.error('❌ Error al eliminar comentario:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el comentario',
              timer: 3500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        });

      }

    });
  }


  getUserAvatar(user: any): string {
    if (user?.avatar) {
      return this.getAvatarUrl(user.avatar);
    }
    return this.defaultAvatar;
  }

  getUserName(user: any): string {
    if (!user) return 'Usuario desconocido';
    return user.name || user.email || 'Usuario';
  }

  tiempoRelativo(fecha: string): string {
    if (!fecha) return '';
    
    const ahora = new Date();
    const entonces = new Date(fecha);
    const diff = ahora.getTime() - entonces.getTime();
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (segundos < 60) return 'Hace unos segundos';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  }

  // =============================
  // 🖼️ MANEJO DE AVATARES
  // =============================
  
  /**
   * 🔧 Helper genérico para construir la URL del avatar
   * Maneja los formatos: "1.png", "2.png", URLs completas, y rutas storage
   */
  private getAvatarUrl(avatarValue: string): string {
    if (!avatarValue) {
      return this.defaultAvatar;
    }
    
    console.log('🔍 getAvatarUrl - Procesando avatar:', avatarValue);
    
    // Si ya es solo el nombre del archivo (ejemplo: "3.png")
    if (avatarValue.match(/^\d+\.png$/)) {
      const url = `assets/media/avatars/${avatarValue}`;
      console.log('✅ Formato nuevo detectado:', url);
      return url;
    }
    
    // Si contiene la ruta completa, usarla tal cual (retrocompatibilidad)
    if (avatarValue.includes('http') || avatarValue.includes('storage')) {
      console.log('✅ URL completa detectada:', avatarValue);
      return avatarValue;
    }
    
    // Si no coincide con ningún patrón, intentar construir la ruta
    const url = `assets/media/avatars/${avatarValue}`;
    console.log('✅ Construyendo ruta genérica:', url);
    return url;
  }

  onAvatarError(event: any): void {
    event.target.src = this.defaultAvatar;
  }

  loadMiembrosAsignados() {
    console.log('🔄 Cargando miembros asignados...');
    
    this.tareaService.getAssignedMembers(this.tareaId).subscribe({
      next: (resp: any) => {
        console.log('✅ Miembros asignados:', resp);
        this.miembrosAsignados = resp.members || [];
      },
      error: (error: any) => {
        console.error('❌ Error al cargar miembros:', error);
        this.miembrosAsignados = [];
      }
    });
  }

  /**
   * Abrir modal para asignar miembros
   */
  abrirModalMiembros() {
    
    // Intentar obtener el grupo_id de múltiples formas
    let grupoId = null;
    
    // Opción 1: Desde tarea.grupo.id
    if (this.tarea?.grupo?.id) {
      grupoId = this.tarea.grupo.id;
    }
    // Opción 2: Desde tarea.grupo_id
    else if (this.tarea?.grupo_id) {
      grupoId = this.tarea.grupo_id;
    }
    // Opción 3: Desde lista.grupo.id
    else if (this.tarea?.lista?.grupo?.id) {
      grupoId = this.tarea.lista.grupo.id;
    }
    // Opción 4: Desde lista.grupo_id
    else if (this.tarea?.lista?.grupo_id) {
      grupoId = this.tarea.lista.grupo_id;
    }
    
    if (!grupoId) {
      
      Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: 'No se puede asignar miembros sin un grupo asociado. Verifica la consola para más detalles.'
      });
      return;
    }

    

    const modalRef = this.modalService.open(AssignMembersTareaComponent, {
      centered: true,
      size: 'lg'
    });
    
    modalRef.componentInstance.TAREA_SELECTED = this.tarea;
    modalRef.componentInstance.GRUPO_ID = grupoId;
    
    modalRef.componentInstance.MembersAssigned.subscribe((tareaActualizada: any) => {
      
      // 🆕 SOLUCIÓN: Actualizar los miembros asignados localmente de inmediato
      this.loadMiembrosAsignados();
      this.loadTimeline();
      
      // 🆕 Si la tarea actualizada incluye assigned_members, actualizarlos localmente
      if (tareaActualizada && tareaActualizada.assigned_members && this.tarea) {
        this.tarea = { ...this.tarea, assigned_members: tareaActualizada.assigned_members };
        this.cdr.detectChanges();
      }
      
      // Emitir cambios al componente padre
      this.TareaE.emit(tareaActualizada || this.tarea);
    });
  }

  /**
   * Desasignar un miembro de la tarea
   */
  desasignarMiembro(userId: number): void {
    const miembro = this.miembrosAsignados.find(m => m.id === userId);
    const nombreMiembro = miembro ? `${miembro.name} ${miembro.surname || ''}` : 'este miembro';

    Swal.fire({
      icon: 'warning',
      title: '¿Desasignar miembro?',
      text: `¿Estás seguro de desasignar a ${nombreMiembro} de esta tarea?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {

        this.tareaService.unassignMemberFromTarea(this.tareaId, userId).subscribe({
          next: (resp: any) => {
            if (resp.message === 200) {

              this.miembrosAsignados = this.miembrosAsignados.filter(m => m.id !== userId);

              if (this.tarea?.assigned_members) {
                this.tarea.assigned_members = this.tarea.assigned_members.filter((m: any) => m.id !== userId);
                this.cdr.detectChanges();
              }

              Swal.fire({
                icon: 'success',
                title: 'Miembro desasignado',
                text: `${nombreMiembro} ha sido desasignado de la tarea.`,
                timer: 1500,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
              });

              this.loadTimeline();
              this.TareaE.emit(resp.tarea || this.tarea);
            }
          },

          error: (error) => {
            console.error('❌ Error al desasignar miembro:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desasignar el miembro. Intenta de nuevo.',
              timer: 3500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        });

      }

    });
  }

  abrirModalEditarFechasInline(): void {
    if (!this.tarea) return;
    
    // Cargar valores actuales
    this.editFechasStartDate = this.tarea.start_date || '';
    this.editFechasDueDate = this.tarea.due_date || '';
    this.editFechasEnableNotifications = this.tarea.notifications_enabled || false;
    this.editFechasNotificationDays = this.tarea.notification_days_before || 1;
    
    this.showEditarFechasModal = true;
  }

  /**
   * Cerrar modal inline
   */
  cerrarModalEditarFechas(): void {
    this.showEditarFechasModal = false;
  }

  /**
   * Guardar cambios del modal inline
   */
  guardarFechasInline(): void {
    if (!this.tarea) return;
    
    // Validación
    if (this.editFechasEnableNotifications && !this.editFechasDueDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Debes establecer una fecha de vencimiento para habilitar las notificaciones',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }
    
    const updateData = {
      start_date: this.editFechasStartDate || null,
      due_date: this.editFechasDueDate || null,
      notifications_enabled: this.editFechasEnableNotifications,
      notification_days_before: this.editFechasEnableNotifications ? this.editFechasNotificationDays : null
    };

    this.tareaService.updateTarea(this.tareaId, updateData).subscribe({
      next: (resp: any) => {
        console.log('✅ Fechas actualizadas:', resp);
        
        // Actualizar la tarea localmente
        if (this.tarea && resp.tarea) {
          this.tarea.start_date = resp.tarea.start_date;
          this.tarea.due_date = resp.tarea.due_date;
          this.tarea.notifications_enabled = resp.tarea.notifications_enabled;
          this.tarea.notification_days_before = resp.tarea.notification_days_before;
          this.tarea.is_overdue = resp.tarea.is_overdue;
          this.tarea.is_due_soon = resp.tarea.is_due_soon;
        }
        
        // Cerrar modal
        this.cerrarModalEditarFechas();
        
        // Recargar timeline
        this.loadTimeline();
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Emitir cambio al padre
        this.TareaE.emit(this.tarea);

        let successMessage = 'Fechas actualizadas correctamente';
        if (this.editFechasEnableNotifications) {
          successMessage += `. Recibirás notificaciones ${this.editFechasNotificationDays} día(s) antes del vencimiento.`;
        }

        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: successMessage,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar fechas:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron actualizar las fechas',
          timer: 3500,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * Abrir modal para editar fechas usando ViewChild
   */
  abrirModalEditarFechas(): void {
    if (this.fechasComponent) {
      this.fechasComponent.openModal();
    } else {
      console.error('❌ Componente fechas no disponible');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo abrir el modal de fechas',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  }

  /**
   * Eliminar fechas de la tarea
   */
  eliminarFechas(): void {
    if (!this.tarea || !this.tarea.id) {
      console.error('❌ No hay tarea para eliminar fechas');
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar fechas?',
      text: 'Se eliminarán las fechas y la configuración de notificaciones de esta tarea',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    }).then(result => {
      if (result.isConfirmed && this.tarea) {
        
        const updateData = {
          start_date: null,
          due_date: null,
          notifications_enabled: false,
          notification_days_before: null
        };

        this.tareaService.updateTarea(this.tareaId, updateData).subscribe({
          next: (resp: any) => {
            console.log('✅ Fechas eliminadas:', resp);
            
            // Actualizar la tarea localmente
            if (this.tarea) {
              this.tarea.start_date = null;
              this.tarea.due_date = null;
              this.tarea.notifications_enabled = false;
              this.tarea.notification_days_before = undefined;
              this.tarea.is_overdue = false;
              this.tarea.is_due_soon = false;
            }
            
            // Recargar timeline
            this.loadTimeline();
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
            
            // Emitir cambio al padre
            this.TareaE.emit(this.tarea);

            Swal.fire({
              icon: 'success',
              title: 'Fechas eliminadas',
              text: 'Las fechas y notificaciones se eliminaron correctamente',
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar fechas:', error);
            
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron eliminar las fechas',
              timer: 3500,
              toast: true,
              position: 'top-end'
            });
          }
        });
      }
    });
  }

}