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
  assigned_members?: any[];
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
  defaultAvatar = 'assets/media/avatars/1.png';
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

  // ✅ NUEVO: Propiedades para edición del nombre de la tarea
  editingTaskName = false;
  tempTaskName = '';

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

  // ✅ NUEVO: Propiedades para edición de checklists
  editingChecklistId: number | null = null;
  editingChecklistName = '';

  // ✅ NUEVO: Propiedades para edición de items de checklist
  editingItemId: number | null = null;
  editingItemName = '';
  editingItemChecklistId: number | null = null;

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

  // Miembros de item de checklist
  showItemMembersModal = false;
  editingItemForMembers: any = null;
  editingChecklistForMembers: any = null;
  availableItemMembers: any[] = [];
  filteredAvailableItemMembers: any[] = [];
  selectedItemMemberIds: number[] = [];
  searchItemMemberText = '';

  // Fechas de item de checklist
  showItemDatePicker = false;
  editingItem: any = null;
  editingChecklistForDate: any = null;
  selectedItemDate: string = '';

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

  // =============================
  // ✅ NUEVO: EDICIÓN DEL NOMBRE DE LA TAREA
  // =============================
  
  /**
   * Activar modo de edición del nombre con doble click
   */
  startEditingTaskName(): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar esta tarea', 'Permiso denegado');
      return;
    }
    
    if (!this.tarea) return;
    
    this.editingTaskName = true;
    this.tempTaskName = this.tarea.name;
    
    // Enfocar el input después de que Angular lo renderice
    setTimeout(() => {
      const input = document.querySelector('.edit-task-name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  /**
   * Cancelar edición del nombre
   */
  cancelEditTaskName(): void {
    this.editingTaskName = false;
    this.tempTaskName = '';
  }

  /**
   * Guardar el nuevo nombre de la tarea
   */
  saveTaskName(): void {
    if (!this.tarea || !this.tempTaskName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la tarea no puede estar vacío',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const newName = this.tempTaskName.trim();
    
    if (newName === this.tarea.name) {
      this.editingTaskName = false;
      return;
    }

    this.tareaService.updateTarea(this.tareaId, { name: newName }).subscribe({
      next: (resp: any) => {
        if (this.tarea) {
          this.tarea.name = newName;
        }
        
        this.editingTaskName = false;
        this.TareaE.emit(this.tarea);
        
        Swal.fire({
          icon: 'success',
          title: 'Nombre actualizado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        this.loadTimeline();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al actualizar nombre:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el nombre de la tarea',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  toggleDescriptionEdit(): void {
    if (this.isReadOnly) {
      this.toastr.warning('No tienes permisos para editar esta tarea', 'Permiso denegado');
      return;
    }
    this.editingDescription = !this.editingDescription;
  }

  checkWritePermissions() {
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
          
          if (!this.hasWriteAccess && !this.isOwner) {
            console.log('👁️ Usuario tiene solo permisos de lectura');
          }
        }
      },
      error: (err) => {
        console.error('❌ Error al verificar permisos:', err);
        this.hasWriteAccess = false;
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
    console.log('📅 Fechas actualizadas, refrescando tarea completa:', tarea);
    
    this.loadTarea();
    
    setTimeout(() => {
      if (this.fechasComponent) {
        console.log('🔄 Refrescando componente fechas hijo...');
        this.fechasComponent.loadFechas();
      }
    }, 300);
    
    this.loadTimeline();
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
    
    this.tareaService.getAdjuntos(this.tareaId).subscribe({
      next: (resp: any) => {
        if (resp.message === 200 && resp.adjuntos) {
          this.adjuntos = resp.adjuntos;
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
          
          // ✅ CORREGIR: Calcular progreso de checklists
          if (this.tarea && this.tarea.checklists && Array.isArray(this.tarea.checklists)) {
            this.tarea.checklists = this.tarea.checklists.map(checklist => {
              const progress = this.calculateChecklistProgress(checklist);
              return { ...checklist, progress };
            });
          }
          
          this.loadAdjuntos();
          this.loadMiembrosAsignados();
          this.loadTimeline();
          
          this.TareaE.emit(this.tarea);
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
  // ✅ NUEVO: FUNCIONES PARA CALCULAR PROGRESO DE CHECKLISTS
  // =============================
  
  /**
   * Calcular el progreso de un checklist basado en sus items completados
   */
  calculateChecklistProgress(checklist: any): number {
    if (!checklist.items || !Array.isArray(checklist.items) || checklist.items.length === 0) {
      return 0;
    }
    
    const completedItems = checklist.items.filter((item: any) => item.completed).length;
    const totalItems = checklist.items.length;
    
    return Math.round((completedItems / totalItems) * 100);
  }

  /**
   * Obtener el número de items completados de un checklist
   */
  getCompletedChecklistItems(checklist: any): number {
    if (!checklist.items || !Array.isArray(checklist.items)) {
      return 0;
    }
    return checklist.items.filter((item: any) => item.completed).length;
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
   */
  convertirFechaParaInput(fecha: string): string {
    if (!fecha) return '';
    
    try {
      const date = new Date(fecha);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
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

  saveEtiqueta(): void {
    if (!this.editingEtiqueta || !this.etiquetaName.trim()) {
      return;
    }

    const etiquetaData: Etiqueta = {
      name: this.etiquetaName.trim(),
      color: this.selectedColor
    };

    this.etiquetasService.updateEtiqueta(this.tareaId, this.editingEtiqueta.id!, etiquetaData).subscribe({
      next: () => {
        this.closeEtiquetaModal();
        this.loadTarea();

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

  /**
   * ✅ Alias para compatibilidad con HTML
   */
  updateEtiqueta(): void {
    this.saveEtiqueta();
  }

  deleteEtiqueta(etiqueta: Etiqueta): void {
    if (!etiqueta.id) return;

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

      if (result.isConfirmed && etiqueta.id) {

        this.etiquetasService.deleteEtiqueta(this.tareaId, etiqueta.id).subscribe({
          next: () => {
            this.loadTarea();

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
      '#61BD4F': 'etiqueta-verde',
      '#F2D600': 'etiqueta-amarillo',
      '#FF9F1A': 'etiqueta-naranja',
      '#EB5A46': 'etiqueta-rojo',
      '#C377E0': 'etiqueta-morado',
      '#0079BF': 'etiqueta-azul',
      '#00C2E0': 'etiqueta-celeste',
      '#51E898': 'etiqueta-lima',
      '#FF78CB': 'etiqueta-rosa',
      '#B3BAC5': 'etiqueta-gris',
      '#344563': 'etiqueta-negro'
    };
    
    return colorMap[color] || 'etiqueta-default';
  }

  // =============================
  // ✅ NUEVO: EDICIÓN DE CHECKLISTS
  // =============================
  
  /**
   * Iniciar edición del nombre del checklist
   */
  startEditingChecklist(checklist: any): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar', 'Permiso denegado');
      return;
    }
    
    this.editingChecklistId = checklist.id;
    this.editingChecklistName = checklist.name;
    
    setTimeout(() => {
      const input = document.querySelector(`.edit-checklist-input-${checklist.id}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  /**
   * Cancelar edición del checklist
   */
  cancelEditChecklist(): void {
    this.editingChecklistId = null;
    this.editingChecklistName = '';
  }

  /**
   * Guardar el nombre del checklist
   */
  saveChecklistName(checklistId: number): void {
    if (!this.editingChecklistName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del checklist no puede estar vacío',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const checklistData = {
      name: this.editingChecklistName.trim()
    };

    this.checklistsService.updateChecklist(this.tareaId, checklistId, checklistData).subscribe({
      next: (resp: any) => {
        this.editingChecklistId = null;
        this.editingChecklistName = '';
        
        this.loadTarea();
        
        Swal.fire({
          icon: 'success',
          title: 'Checklist actualizado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al actualizar checklist:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el checklist',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  deleteChecklist(checklistId: number): void {
    if (!checklistId) return;

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar checklist?',
      text: 'Se eliminará el checklist y todos sus items',
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
  // ✅ NUEVO: AGREGAR ITEMS A CHECKLIST
  // =============================
  
  /**
   * Mostrar el input para agregar un nuevo item
   */
  showAddItemInput(checklist: any): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para agregar items', 'Permiso denegado');
      return;
    }
    
    checklist.addingItem = true;
    checklist.newItemName = '';
    
    setTimeout(() => {
      const input = document.querySelector('.add-item-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 50);
  }

  
  /**
   * Añadir un nuevo item al checklist
   * @param checklistId - ID del checklist
   * @param itemName - Nombre del nuevo item
   */
  addChecklistItem(checklistId: number, itemName: string): void {
    if (!itemName || !itemName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del item no puede estar vacío',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const itemData = {
      name: itemName.trim(),
      completed: false
    };

    this.checklistsService.addItem(this.tareaId, checklistId, itemData).subscribe({
      next: (resp: any) => {
        console.log('✅ Item añadido:', resp);
        
        // Recargar la tarea para actualizar el progreso
        this.loadTarea();
        
        Swal.fire({
          icon: 'success',
          title: 'Item añadido',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al añadir item:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo añadir el item',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * Cancelar la adición de un item
   */
  cancelAddItem(checklist: any): void {
    checklist.addingItem = false;
    checklist.newItemName = '';
  }

  // =============================
  // ✅ NUEVO: EDICIÓN DE ITEMS DE CHECKLIST
  // =============================
  
  /**
   * Iniciar edición del nombre del item
   */
  startEditingItem(checklistId: number, item: any): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar', 'Permiso denegado');
      return;
    }
    
    this.editingItemId = item.id;
    this.editingItemChecklistId = checklistId;
    this.editingItemName = item.name;
    
    setTimeout(() => {
      const input = document.querySelector(`.edit-item-input-${item.id}`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  /**
   * Cancelar edición del item
   */
  cancelEditItem(): void {
    this.editingItemId = null;
    this.editingItemChecklistId = null;
    this.editingItemName = '';
  }

  /**
   * Guardar el nombre del item
   */
  saveItemName(checklistId: number, itemId: number): void {
    if (!this.editingItemName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del item no puede estar vacío',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const itemData = {
      name: this.editingItemName.trim()
    };

    this.checklistsService.updateItem(this.tareaId, checklistId, itemId, itemData).subscribe({
      next: (resp: any) => {
        this.editingItemId = null;
        this.editingItemChecklistId = null;
        this.editingItemName = '';
        
        this.loadTarea();
        
        Swal.fire({
          icon: 'success',
          title: 'Item actualizado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        this.loadTimeline();
      },
      error: (error) => {
        console.error('❌ Error al actualizar item:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el item',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * Alternar el estado de completado de un item del checklist
   */
  toggleChecklistItem(checklistId: number, itemId: number): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar', 'Permiso denegado');
      return;
    }

    // Encontrar el checklist y el item
    const checklist = this.tarea?.checklists?.find((c: any) => c.id === checklistId);
    if (!checklist) return;
    
    const item = checklist.items?.find((i: any) => i.id === itemId);
    if (!item) return;

    // Invertir el estado completed
    const newCompletedState = !item.completed;

    this.checklistsService.updateItem(this.tareaId, checklistId, itemId, { completed: newCompletedState }).subscribe({
      next: (resp: any) => {
        // Actualizar localmente
        item.completed = newCompletedState;
        
        // Recalcular el progreso del checklist
        checklist.progress = this.calculateChecklistProgress(checklist);
        
        this.cdr.detectChanges();
        this.loadTimeline();
        
        console.log('✅ Item actualizado, progreso:', checklist.progress);
      },
      error: (error) => {
        console.error('❌ Error al actualizar item:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el item',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  deleteChecklistItem(checklistId: number, itemId: number): void {
    if (!checklistId || !itemId) return;

    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar item?',
      text: 'Se eliminará este item del checklist',
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

            Swal.fire({
              icon: 'success',
              title: 'Item eliminado',
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
              text: 'No se pudo eliminar el item',
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
  // 💬 COMENTARIOS / TIMELINE
  // =============================
  
  loadTimeline(): void {
    console.log('🔄 Cargando timeline de la tarea:', this.tareaId);
    
    this.tareaService.getTimeline(this.tareaId).subscribe({
      next: (resp: any) => {
        console.log('✅ Timeline cargado:', resp);
        
        if (resp.message === 200 && resp.timeline) {
          this.timeline = resp.timeline;
          console.log('📋 Timeline completo:', this.timeline);
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar timeline:', error);
        this.timeline = [];
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Escribe un comentario antes de enviarlo',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const commentContent = this.newComment.trim();

    this.tareaService.addComment(this.tareaId, commentContent).subscribe({
      next: (resp: any) => {
        console.log('✅ Comentario agregado:', resp);
        
        this.newComment = '';
        this.loadTimeline();
        
        Swal.fire({
          icon: 'success',
          title: 'Comentario agregado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('❌ Error al agregar comentario:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar el comentario',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * ✅ Verificar si un comentario pertenece al usuario actual
   */
  isOwnComment(item: any): boolean {
    // Obtener el ID del usuario actual desde authService
    const currentUserId = this.tareaService.authservice.user?.id;
    return item.user_id === currentUserId;
  }

  /**
   * ✅ Verificar si un comentario está en modo edición
   */
  isEditingComment(commentId: number): boolean {
    return this.editingCommentId === commentId;
  }

  /**
   * ✅ Iniciar edición de un comentario
   */
  editComment(comentarioId: number): void {
    if (this.isReadOnly || !this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar comentarios', 'Permiso denegado');
      return;
    }
    
    // Encontrar el comentario en el timeline
    const comentario = this.timeline.find(item => item.id === comentarioId);
    if (!comentario) return;
    
    this.editingCommentId = comentarioId;
    this.editingCommentContent = comentario.content;
    
    setTimeout(() => {
      const textarea = document.querySelector('.comment-edit-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    }, 50);
  }

  /**
   * ✅ Alias para mantener compatibilidad con HTML
   */
  startEditingComment(comentario: any): void {
    this.editComment(comentario.id);
  }

  /**
   * ✅ Cancelar edición de comentario
   */
  cancelCommentEdit(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  /**
   * ✅ Alias para mantener compatibilidad
   */
  cancelEditComment(): void {
    this.cancelCommentEdit();
  }

  /**
   * ✅ Guardar comentario editado
   */
  saveCommentEdit(comentarioId: number): void {
    if (!this.editingCommentContent.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El comentario no puede estar vacío',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const commentContent = this.editingCommentContent.trim();

    this.tareaService.updateComment(this.tareaId, comentarioId, commentContent).subscribe({
      next: (resp: any) => {
        this.editingCommentId = null;
        this.editingCommentContent = '';
        
        this.loadTimeline();
        
        Swal.fire({
          icon: 'success',
          title: 'Comentario actualizado',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      },
      error: (error) => {
        console.error('❌ Error al actualizar comentario:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el comentario',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * ✅ Alias para mantener compatibilidad
   */
  saveEditedComment(comentarioId: number): void {
    this.saveCommentEdit(comentarioId);
  }

  deleteComment(comentarioId: number): void {
    if (!comentarioId) return;

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

        this.tareaService.deleteComment(this.tareaId, comentarioId).subscribe({
          next: () => {
            this.loadTimeline();

            Swal.fire({
              icon: 'success',
              title: 'Comentario eliminado',
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar comentario:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el comentario',
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

  getTiempoRelativo(fecha: string): string {
    if (!fecha) return '';
    
    const ahora = new Date();
    const fechaComentario = new Date(fecha);
    const diff = ahora.getTime() - fechaComentario.getTime();
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  // =============================
  // 📎 ADJUNTOS
  // =============================
  
  abrirModalAdjuntar(): void {
    const modalRef = this.modalService.open(AdjuntarModalComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.adjuntosExistentes = this.adjuntos;

    modalRef.result.then(
      (result: any) => {
        if (result && result.type) {
          
          if (result.type === 'archivo' && result.data.file) {
            const formData = new FormData();
            formData.append('tipo', 'archivo');
            formData.append('file', result.data.file);

            this.tareaService.addAdjunto(this.tareaId, formData).subscribe({
              next: (resp: any) => {
                console.log('✅ Archivo subido:', resp);
                this.loadAdjuntos();
                this.loadTimeline();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Archivo adjuntado',
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
                  showConfirmButton: false,
                  toast: true,
                  position: 'top-end'
                });
              }
            });
          } else if (result.type === 'enlace' && result.data) {
            const enlaceData = {
              tipo: 'enlace',
              nombre: result.data.nombre,
              url: result.data.url
            };

            this.tareaService.addAdjunto(this.tareaId, enlaceData).subscribe({
              next: (resp: any) => {
                console.log('✅ Enlace agregado:', resp);
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
                console.error('❌ Error al agregar enlace:', error);
                
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'No se pudo agregar el enlace',
                  timer: 3500,
                  showConfirmButton: false,
                  toast: true,
                  position: 'top-end'
                });
              }
            });
          }
        }
      },
      () => {}
    );
  }

  abrirEnlace(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  eliminarEnlace(enlaceId: number): void {
    if (!enlaceId) return;

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
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar enlace:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el enlace',
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

  obtenerIconoArchivo(tipo: string): string {
    if (!tipo) return 'fa-file';
    
    if (tipo.startsWith('image/')) return 'fa-file-image';
    if (tipo === 'application/pdf') return 'fa-file-pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'fa-file-excel';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'fa-file-powerpoint';
    
    return 'fa-file';
  }

  esArchivoVisualizable(archivo: any): boolean {
    if (!archivo.tipo) return false;
    
    return archivo.tipo.startsWith('image/') || archivo.tipo === 'application/pdf';
  }

  visualizarArchivo(archivo: any): void {
    if (archivo.file_url) {
      window.open(archivo.file_url, '_blank');
    }
  }

  descargarArchivo(archivo: any): void {
    if (archivo.file_url) {
      // Si tiene URL directa, abrir en nueva pestaña para descarga
      const link = document.createElement('a');
      link.href = archivo.file_url;
      link.download = archivo.nombre || 'archivo';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (archivo.id) {
      // Si no tiene URL pero tiene ID, intentar descargar vía API
      Swal.fire({
        icon: 'info',
        title: 'Descargando...',
        text: 'Preparando el archivo para descarga',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      // Abrir la URL de descarga en nueva pestaña
      window.open(`/api/tareas/${this.tareaId}/adjuntos/${archivo.id}/download`, '_blank');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede descargar este archivo',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  }

  eliminarArchivo(archivoId: number): void {
    if (!archivoId) return;

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
              timer: 1500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          },
          error: (error) => {
            console.error('❌ Error al eliminar archivo:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el archivo',
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

  tiempoRelativo(fecha: string): string {
    if (!fecha) return '';
    
    const ahora = new Date();
    const fechaArchivo = new Date(fecha);
    const diff = ahora.getTime() - fechaArchivo.getTime();
    
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'hace un momento';
  }

  // =============================
  // 👥 MIEMBROS ASIGNADOS
  // =============================
  
  loadMiembrosAsignados(): void {
    console.log('👥 Cargando miembros asignados de la tarea:', this.tareaId);
    
    this.tareaService.getAssignedMembers(this.tareaId).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de miembros asignados:', resp);
        
        if (resp.message === 200) {
          this.miembrosAsignados = resp.members || [];
          
          if (this.tarea) {
            this.tarea.assigned_members = this.miembrosAsignados;
          }
          
          console.log('👥 Miembros asignados cargados:', this.miembrosAsignados.length);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar miembros asignados:', error);
        this.miembrosAsignados = [];
      }
    });
  }

  abrirModalMiembros(): void {
    const modalRef = this.modalService.open(AssignMembersTareaComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.TAREA_SELECTED = this.tarea;
    modalRef.componentInstance.GRUPO_ID = this.grupo_id;

    modalRef.componentInstance.MembersAssigned.subscribe((tareaActualizada: any) => {
      console.log('✅ Miembros asignados desde modal:', tareaActualizada);
      
      this.loadMiembrosAsignados();
      this.loadTimeline();
      
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
        
        if (this.tarea && resp.tarea) {
          this.tarea.start_date = resp.tarea.start_date;
          this.tarea.due_date = resp.tarea.due_date;
          this.tarea.notifications_enabled = resp.tarea.notifications_enabled;
          this.tarea.notification_days_before = resp.tarea.notification_days_before;
          this.tarea.is_overdue = resp.tarea.is_overdue;
          this.tarea.is_due_soon = resp.tarea.is_due_soon;
        }
        
        this.cerrarModalEditarFechas();
        this.loadTimeline();
        this.cdr.detectChanges();
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
            
            if (this.tarea) {
              this.tarea.start_date = null;
              this.tarea.due_date = null;
              this.tarea.notifications_enabled = false;
              this.tarea.notification_days_before = undefined;
              this.tarea.is_overdue = false;
              this.tarea.is_due_soon = false;
            }
            
            this.loadTimeline();
            this.cdr.detectChanges();
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

  /**
   * 🎨 Obtener la ruta correcta del avatar de un usuario
   */
  getUserAvatar(user: any): string {
    if (user?.avatar) {
      return this.getAvatarUrl(user.avatar);
    }
    return this.defaultAvatar;
  }

  

  /**
   * 🖼️ Manejo de error al cargar avatar
   */
  onAvatarError(event: any): void {
    console.error('❌ Error al cargar avatar, usando fallback');
    event.target.src = this.defaultAvatar;
  }

  
  /**
   * Abrir modal para asignar miembros a un item de checklist
   */
  openItemMembersModal(checklistId: number, item: any): void {
    if (!this.hasWriteAccess) return;
    
    this.editingItemForMembers = item;
    this.editingChecklistForMembers = this.tarea?.checklists?.find(c => c.id === checklistId);
    
    // Pre-seleccionar miembros ya asignados
    this.selectedItemMemberIds = item.assigned_users?.map((u: any) => u.id) || [];
    this.searchItemMemberText = '';
    
    // Cargar miembros disponibles (los de la tarea)
    this.loadAvailableItemMembers();
    
    this.showItemMembersModal = true;
  }

    
  /**
   * Cerrar modal de miembros
   */
  closeItemMembersModal(): void {
    this.showItemMembersModal = false;
    this.editingItemForMembers = null;
    this.editingChecklistForMembers = null;
    this.selectedItemMemberIds = [];
    this.searchItemMemberText = '';
  }

  /**
   * Cargar miembros disponibles para asignar
   */
  

  loadAvailableItemMembers(): void {
    this.tareaService.getAssignedMembers(this.tareaId).subscribe({
      next: (resp: any) => {
        this.availableItemMembers = resp.members || [];
        this.filteredAvailableItemMembers = [...this.availableItemMembers];
        console.log('✅ Miembros disponibles cargados:', this.availableItemMembers);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar miembros:', error);
      }
    });
  }

  /**
   * Filtrar miembros disponibles según búsqueda
   */
  filterAvailableItemMembers(): void {
    const searchLower = this.searchItemMemberText.toLowerCase();
    this.filteredAvailableItemMembers = this.availableItemMembers.filter(user => {
      const fullName = `${user.name} ${user.surname || ''}`.toLowerCase();
      return fullName.includes(searchLower) || user.email.toLowerCase().includes(searchLower);
    });
  }

  /**
   * Alternar selección de un miembro
   */
  toggleItemMemberSelection(user: any): void {
    const index = this.selectedItemMemberIds.indexOf(user.id);
    if (index > -1) {
      this.selectedItemMemberIds.splice(index, 1);
    } else {
      this.selectedItemMemberIds.push(user.id);
    }
  }

  /**
   * Verificar si un miembro está seleccionado
   */
  isItemMemberSelected(userId: number): boolean {
    return this.selectedItemMemberIds.includes(userId);
  }

  /**
   * Guardar miembros asignados al item
   */
  saveItemMembers(): void {
    if (!this.editingItemForMembers || !this.editingChecklistForMembers) {
      console.error('❌ No hay item o checklist seleccionado para asignar miembros');
      return;
    }

    console.log('💾 Guardando miembros para item:', this.editingItemForMembers.id);
    console.log('📋 Checklist ID:', this.editingChecklistForMembers.id);
    console.log('👥 IDs de miembros seleccionados:', this.selectedItemMemberIds);

    const updatedItem: any = {
      assigned_users: this.selectedItemMemberIds
    };

    this.checklistsService.updateItem(
      this.tareaId,
      this.editingChecklistForMembers.id,
      this.editingItemForMembers.id,
      updatedItem
    ).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta completa del servidor:', resp);
        
        // ✅ CORRECCIÓN CRÍTICA: Actualizar el item local INMEDIATAMENTE
        if (resp.item && resp.item.assigned_users) {
          
          // Encontrar el checklist en la tarea local
          const checklistIndex = this.tarea?.checklists?.findIndex(c => c.id === this.editingChecklistForMembers.id);
          
          if (checklistIndex !== undefined && checklistIndex !== -1 && this.tarea?.checklists) {
            const checklist = this.tarea.checklists[checklistIndex];
            
            // Encontrar el item dentro del checklist
            const itemIndex = checklist.items?.findIndex((i: any) => i.id === this.editingItemForMembers.id);
            
            if (itemIndex !== undefined && itemIndex !== -1 && checklist.items) {
              // ✅ Actualizar los usuarios asignados del item local
              checklist.items[itemIndex].assigned_users = resp.item.assigned_users;
              
              console.log('✅ Item local actualizado exitosamente');
              console.log('📋 Checklist actualizado:', checklist);
              console.log('📝 Item actualizado:', checklist.items[itemIndex]);
              console.log('👥 Miembros asignados:', checklist.items[itemIndex].assigned_users);
            } else {
              console.warn('⚠️ No se encontró el item en el checklist local');
            }
          } else {
            console.warn('⚠️ No se encontró el checklist en la tarea local');
          }
        } else {
          console.warn('⚠️ La respuesta no incluye item o assigned_users');
        }
        
        // ✅ Forzar detección de cambios en Angular
        this.cdr.detectChanges();
        
        const memberCount = this.selectedItemMemberIds.length;
        const memberText = memberCount === 1 ? 'miembro' : 'miembros';
        
        Swal.fire({
          icon: 'success',
          title: 'Miembros asignados',
          text: `${memberCount} ${memberText} asignado(s) exitosamente`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        this.closeItemMembersModal();
      },
      error: (error: any) => {
        console.error('❌ Error al asignar miembros:', error);
        console.error('📍 Detalles completos del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        
        let errorMessage = 'No se pudieron asignar los miembros al elemento';
        
        if (error.status === 404) {
          errorMessage = 'No se encontró el elemento del checklist';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para asignar miembros';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor. Verifica los logs del backend.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  // ========================================
  // MÉTODOS PARA FECHAS EN ITEMS
  // ========================================

  /**
   * Abrir modal para asignar fecha a un item de checklist
   */
  openItemDatePicker(checklistId: number, item: any): void {
    if (!this.hasWriteAccess) return;
    
    this.editingItem = item;
    this.editingChecklistForDate = this.tarea?.checklists?.find(c => c.id === checklistId);
    this.selectedItemDate = item.due_date || '';
    this.showItemDatePicker = true;
  }

  /**
   * Cerrar modal de fecha
   */
  closeItemDatePicker(): void {
    this.showItemDatePicker = false;
    this.editingItem = null;
    this.editingChecklistForDate = null;
    this.selectedItemDate = '';
  }

  /**
   * Obtener fecha de hoy en formato YYYY-MM-DD
   */
  // getTodayDate(): string {
  //   return new Date().toISOString().split('T')[0];
  // }

  /**
   * Establecer fecha rápida (mañana, 1 semana, 1 mes)
   */
  setItemQuickDate(days: number): void {
    const date = new Date();
    date.setDate(date.getDate() + days);
    this.selectedItemDate = date.toISOString().split('T')[0];
  }

  /**
   * Guardar fecha asignada al item
   */
  saveItemDate(): void {
    if (!this.editingItem || !this.editingChecklistForDate) {
      return;
    }

    if (!this.selectedItemDate) {
      this.toastr.warning('Debes seleccionar una fecha', 'Validación');
      return;
    }

    const updatedItem: any = {
      due_date: this.selectedItemDate
    };

    this.checklistsService.updateItem(
      this.tareaId,
      this.editingChecklistForDate.id,
      this.editingItem.id,
      updatedItem
    ).subscribe({
      next: (resp: any) => {
        this.toastr.success('Fecha asignada correctamente', 'Éxito');
        this.loadTarea();
        this.closeItemDatePicker();
      },
      error: (error: any) => {
        console.error('❌ Error al asignar fecha:', error);
        this.toastr.error('No se pudo asignar la fecha', 'Error');
      }
    });
  }

  /**
   * Eliminar fecha del item
   */
  removeItemDate(): void {
    if (!this.editingItem || !this.editingChecklistForDate) {
      return;
    }

    const updatedItem: any = {
      due_date: null
    };

    this.checklistsService.updateItem(
      this.tareaId,
      this.editingChecklistForDate.id,
      this.editingItem.id,
      updatedItem
    ).subscribe({
      next: (resp: any) => {
        this.toastr.success('Fecha eliminada correctamente', 'Éxito');
        this.loadTarea();
        this.closeItemDatePicker();
      },
      error: (error: any) => {
        console.error('❌ Error al eliminar fecha:', error);
        this.toastr.error('No se pudo eliminar la fecha', 'Error');
      }
    });
  }

  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================

  /**
   * 🔧 Formatear fecha para badge (Hoy, Mañana, fecha) - CORREGIDO
   */
  formatDateBadge(dateString: string | null | undefined): string {
    if (!dateString) {
      console.warn('⚠️ formatDateBadge: Fecha vacía o undefined');
      return '';
    }
    
    console.log('📅 formatDateBadge - Entrada:', dateString, typeof dateString);
    
    try {
      let date: Date;
      
      // Intentar parsear diferentes formatos de fecha
      if (dateString.includes('T')) {
        // Formato ISO completo con hora (2025-02-09T00:00:00.000Z)
        date = new Date(dateString);
        console.log('📅 Parseado como ISO con hora');
      } else if (dateString.includes('-')) {
        // Formato YYYY-MM-DD
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          date = new Date(year, month - 1, day);
          console.log('📅 Parseado como YYYY-MM-DD');
        } else {
          throw new Error('Formato YYYY-MM-DD inválido');
        }
      } else if (dateString.includes('/')) {
        // Formato DD/MM/YYYY o MM/DD/YYYY
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Asumimos DD/MM/YYYY
          const [day, month, year] = parts.map(Number);
          date = new Date(year, month - 1, day);
          console.log('📅 Parseado como DD/MM/YYYY');
        } else {
          throw new Error('Formato DD/MM/YYYY inválido');
        }
      } else {
        console.warn('⚠️ Formato de fecha no reconocido:', dateString);
        return dateString;
      }
      
      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.error('❌ Fecha inválida después de parsear:', dateString);
        return 'Fecha inválida';
      }
      
      // Obtener fecha de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Obtener fecha de mañana
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Normalizar la fecha parseada para comparación (sin horas)
      date.setHours(0, 0, 0, 0);
      
      console.log('📅 Fecha parseada:', date.toISOString());
      console.log('📅 Hoy:', today.toISOString());
      console.log('📅 Mañana:', tomorrow.toISOString());
      
      // Comparar fechas
      if (date.getTime() === today.getTime()) {
        console.log('✅ Resultado: Hoy');
        return 'Hoy';
      } else if (date.getTime() === tomorrow.getTime()) {
        console.log('✅ Resultado: Mañana');
        return 'Mañana';
      } else {
        // Formato: "12/03/2026" (DD/MM/YYYY)
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formatted = `${day}/${month}/${year}`;
        console.log('✅ Resultado:', formatted);
        return formatted;
      }
    } catch (error) {
      console.error('❌ Error al formatear fecha:', error);
      console.error('❌ Fecha que causó el error:', dateString);
      return 'Error en fecha';
    }
  }

  /**
   * 🔧 Obtener iniciales de un usuario
   */
  getInitials(name: string, surname?: string): string {
    if (!name) return '?';
    const firstInitial = name.charAt(0).toUpperCase();
    const lastInitial = surname ? surname.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  }


  /**
   * 🆕 Manejar error de carga de imagen
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'assets/media/avatars/blank.png';
    }
  }

  /**
   * 🆕 Obtener fecha de hoy en formato YYYY-MM-DD
   */
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  



  // -------------------------------------------------------------

  
  /**
   * 🔧 Construir la URL correcta del avatar - IGUAL QUE PROJECTS COMPONENT
   */
  public getAvatarUrl(avatarValue: string | null | undefined): string {
    if (!avatarValue) {
      return 'assets/media/avatars/blank.png';
    }

    // Caso: solo número "3"
    if (/^\d+$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}.png`;
    }

    // Caso: "3.png"
    if (/^\d+\.png$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}`;
    }

    // Caso: URL completa del backend (seguridad adicional)
    if (avatarValue.includes('http://') || avatarValue.includes('https://') || avatarValue.includes('storage')) {
      const file = avatarValue.split('/').pop();
      return `assets/media/avatars/${file}`;
    }

    // Caso general: archivo con nombre
    if (avatarValue.includes('.')) {
      return `assets/media/avatars/${avatarValue}`;
    }

    // Caso: nombre sin extensión
    return `assets/media/avatars/${avatarValue}.png`;
  }

  /**
   * 🔧 REEMPLAZAR el método getAvatarPath() existente con esta versión mejorada
   * Ubicación: Buscar el método getAvatarPath() y reemplazarlo con este
   */
  getAvatarPath(avatar: string | null | undefined): string {
    // Usar el mismo método que projects.component
    return this.getAvatarUrl(avatar);
  }

}