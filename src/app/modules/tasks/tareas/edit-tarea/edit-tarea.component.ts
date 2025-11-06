import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TareaService } from '../service/tarea.service';
import { ChecklistsService } from '../service/checklists.service';
import { EtiquetasService, Etiqueta } from '../service/etiquetas.service';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdjuntarModalComponent, Enlace, Archivo } from '../adjuntar-modal/adjuntar-modal.component';
import { AssignMembersTareaComponent } from '../assign-members-tarea/assign-members-tarea.component';
import { GrupoService } from '../../grupos/service/grupo.service';

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
}

@Component({
  selector: 'app-edit-tarea',
  templateUrl: './edit-tarea.component.html',
  styleUrls: ['./edit-tarea.component.scss']
})
export class EditTareaComponent implements OnInit {

  @Input() TAREA_SELECTED?: { id: number };
  @Input() users: any[] = [];
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

  constructor(
    public modal: NgbActiveModal,
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private checklistsService: ChecklistsService,
    private etiquetasService: EtiquetasService,
    private modalService: NgbModal,
    private grupoService: GrupoService 
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

  checkWritePermissions() {
    if (this.tarea && this.tarea.grupo_id) {
      this.grupoService.checkWriteAccess(this.tarea.grupo_id).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.hasWriteAccess = resp.has_write_access;
          }
        },
        error: (err: any) => {  // ✅ AGREGAR TIPADO
          console.error('Error al verificar permisos:', err);
          this.hasWriteAccess = false;
        }
      });
    }
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
          
          // Cargar adjuntos
          this.adjuntos = this.tarea?.adjuntos || { enlaces: [], archivos: [] };
          
          // 🆕 CARGAR MIEMBROS ASIGNADOS
          this.loadMiembrosAsignados();
          
          // Cargar timeline
          this.loadTimeline();
          
          console.log('📋 Tarea completa:', this.tarea);
        } else {
          console.error('❌ Respuesta inesperada:', resp);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de la tarea.'
          });
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar tarea:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.userMessage || 'No se pudo cargar la tarea. Por favor, intenta de nuevo.'
        });
      }
    });
  }

  // =============================
  // 📅 ESTADO DE LA TAREA
  // =============================
  updateStatus(): void {
    if (!this.tarea) return;
    
    console.log('🔄 Actualizando estado a:', this.tarea.status);
    
    this.tareaService.updateTarea(this.tareaId, { status: this.tarea.status }).subscribe({
      next: () => {
        console.log('✅ Estado actualizado correctamente');
        this.TareaE.emit(this.tarea);
        Swal.fire({ 
          icon: 'success', 
          title: 'Estado actualizado', 
          timer: 1200, 
          showConfirmButton: false 
        });
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar estado:', error);
        Swal.fire({ 
          icon: 'error', 
          title: 'No se pudo actualizar el estado' 
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
    
    console.log('💾 Guardando descripción:', this.tarea.description);
    
    this.tareaService.updateTarea(this.tareaId, { description: this.tarea.description }).subscribe({
      next: () => {
        console.log('✅ Descripción guardada correctamente');
        this.editingDescription = false;
        this.TareaE.emit(this.tarea);
        Swal.fire({ 
          icon: 'success', 
          title: 'Descripción guardada', 
          timer: 1200, 
          showConfirmButton: false 
        });
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al guardar descripción:', error);
        Swal.fire({ 
          icon: 'error', 
          title: 'No se pudo guardar la descripción' 
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
        title: 'Fecha de vencimiento requerida',
        text: 'Debes ingresar al menos la fecha de vencimiento'
      });
      return;
    }

    const data: any = {
      due_date: this.dueDate
    };

    // La fecha de inicio es opcional
    if (this.startDate) {
      data.start_date = this.startDate;
    }

    console.log('💾 Guardando fechas:', data);

    this.tareaService.updateTarea(this.tareaId, data).subscribe({
      next: () => {
        console.log('✅ Fechas guardadas');
        this.editingFechas = false;
        this.loadTarea();
        this.TareaE.emit(this.tarea);
        Swal.fire({ 
          icon: 'success', 
          title: 'Fechas guardadas', 
          timer: 1200, 
          showConfirmButton: false 
        });
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al guardar fechas:', error);
        Swal.fire({ 
          icon: 'error', 
          title: 'No se pudieron guardar las fechas' 
        });
      }
    });
  }

  deleteFechas(): void {
    Swal.fire({
      title: '¿Eliminar fechas?',
      text: 'Se eliminarán las fechas de inicio y vencimiento',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const data = {
          start_date: null,
          due_date: null
        };

        this.tareaService.updateTarea(this.tareaId, data).subscribe({
          next: () => {
            console.log('✅ Fechas eliminadas');
            this.loadTarea();
            this.TareaE.emit(this.tarea);
            Swal.fire({ 
              icon: 'success', 
              title: 'Fechas eliminadas', 
              timer: 1200, 
              showConfirmButton: false 
            });
            this.loadTimeline();
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar fechas:', error);
            Swal.fire({ 
              icon: 'error', 
              title: 'No se pudieron eliminar las fechas' 
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
        console.log('✅ Etiqueta actualizada');
        this.closeEtiquetaModal();
        this.loadTarea();
        this.TareaE.emit(this.tarea);
        Swal.fire({ 
          icon: 'success', 
          title: 'Etiqueta actualizada', 
          timer: 1200, 
          showConfirmButton: false 
        });
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar etiqueta:', error);
        Swal.fire({ 
          icon: 'error', 
          title: 'No se pudo actualizar la etiqueta' 
        });
      }
    });
  }

  deleteEtiqueta(etiqueta: Etiqueta): void {
    Swal.fire({
      title: '¿Eliminar etiqueta?',
      text: `Se eliminará la etiqueta "${etiqueta.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && etiqueta.id) {
        this.etiquetasService.deleteEtiqueta(this.tareaId, etiqueta.id).subscribe({
          next: () => {
            console.log('✅ Etiqueta eliminada');
            this.loadTarea();
            this.TareaE.emit(this.tarea);
            Swal.fire({ 
              icon: 'success', 
              title: 'Etiqueta eliminada', 
              timer: 1200, 
              showConfirmButton: false 
            });
            this.loadTimeline();
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar etiqueta:', error);
            Swal.fire({ 
              icon: 'error', 
              title: 'No se pudo eliminar la etiqueta' 
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
      title: '¿Eliminar checklist?',
      text: 'Se eliminarán todos los elementos del checklist',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.checklistsService.deleteChecklist(this.tareaId, checklistId).subscribe({
          next: () => {
            console.log('✅ Checklist eliminado');
            this.loadTarea();
            this.TareaE.emit(this.tarea);
            Swal.fire({
              icon: 'success',
              title: 'Checklist eliminado',
              timer: 1200,
              showConfirmButton: false
            });
            this.loadTimeline();
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar checklist:', error);
            Swal.fire({
              icon: 'error',
              title: 'No se pudo eliminar el checklist'
            });
          }
        });
      }
    });
  }

  deleteChecklistItem(checklistId: number, itemId: number): void {
    Swal.fire({
      title: '¿Eliminar elemento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.checklistsService.deleteItem(this.tareaId, checklistId, itemId).subscribe({
          next: () => {
            console.log('✅ Item eliminado');
            this.loadTarea();
            this.TareaE.emit(this.tarea);
            Swal.fire({
              icon: 'success',
              title: 'Elemento eliminado',
              timer: 1200,
              showConfirmButton: false
            });
            this.loadTimeline();
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar item:', error);
            Swal.fire({
              icon: 'error',
              title: 'No se pudo eliminar el elemento'
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
    if (!checklist.newItemName || !checklist.newItemName.trim()) {
      return;
    }

    console.log('➕ Agregando item:', checklist.newItemName);

    this.checklistsService.addItem(this.tareaId, checklist.id, {
      name: checklist.newItemName.trim(),
      completed: false
    }).subscribe({
      next: () => {
        console.log('✅ Item agregado');
        checklist.addingItem = false;
        checklist.newItemName = '';
        this.loadTarea();
        this.TareaE.emit(this.tarea);
        Swal.fire({
          icon: 'success',
          title: 'Elemento agregado',
          timer: 1200,
          showConfirmButton: false
        });
        this.loadTimeline();
      },
      error: (error: any) => {
        console.error('❌ Error al agregar item:', error);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo agregar el elemento'
        });
      }
    });
  }

  // =============================
  // 📎 ADJUNTOS - CORRECCIÓN APLICADA
  // =============================
  
  abrirModalAdjuntar(): void {
    const modalRef = this.modalService.open(AdjuntarModalComponent, {
      size: 'lg',
      centered: true
    });

    modalRef.componentInstance.adjuntosExistentes = this.adjuntos;

    modalRef.result.then(
      (result) => {
        if (result) {
          console.log('✅ Adjunto agregado:', result);
          
          if (result.type === 'archivo') {
            this.guardarArchivo(result.data);
          } else if (result.type === 'enlace') {
            this.guardarEnlace(result.data);
          }
        }
      },
      (reason) => {
        console.log('Modal cerrado sin guardar:', reason);
      }
    );
  }

  /**
   * 🔧 CORRECCIÓN 4: Mejorar la subida de archivos (especialmente imágenes)
   */
  guardarArchivo(archivo: Archivo): void {
    if (!this.tarea || !archivo.file) {
      console.error('❌ No hay tarea o archivo para guardar');
      return;
    }

    const formData = new FormData();
    formData.append('tipo', 'archivo');
    formData.append('file', archivo.file, archivo.file.name);
    
    // Log para debug
    console.log('📤 Subiendo archivo:', {
      nombre: archivo.file.name,
      tipo: archivo.file.type,
      tamaño: archivo.file.size
    });

    this.tareaService.addAdjunto(this.tareaId, formData).subscribe({
      next: (resp) => {
        console.log('✅ Archivo guardado:', resp);
        this.loadTarea();
        this.TareaE.emit(this.tarea);
        Swal.fire({
          icon: 'success',
          title: 'Archivo adjuntado correctamente',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar archivo:', error);
        
        let errorMsg = 'Error al adjuntar el archivo';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 413) {
          errorMsg = 'El archivo es demasiado grande';
        } else if (error.status === 422) {
          errorMsg = 'Tipo de archivo no permitido';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg
        });
      }
    });
  }

  guardarEnlace(enlace: Enlace): void {
    if (!this.tarea) return;

    const data = {
      tipo: 'enlace',
      nombre: enlace.nombre,
      url: enlace.url
    };

    this.tareaService.addAdjunto(this.tareaId, data).subscribe({
      next: (resp) => {
        console.log('✅ Enlace guardado:', resp);
        this.loadTarea();
        this.TareaE.emit(this.tarea);
        Swal.fire({
          icon: 'success',
          title: 'Enlace agregado',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar enlace:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar enlace'
        });
      }
    });
  }

  /**
   * 🔧 CORRECCIÓN 3: Agregar método para descargar archivos
   */
  descargarArchivo(archivo: any): void {
    if (!archivo.file_url && !archivo.url) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede descargar el archivo: URL no disponible'
      });
      return;
    }

    const url = archivo.file_url || archivo.url;
    console.log('⬇️ Descargando archivo desde:', url);

    // Crear un elemento <a> temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = archivo.nombre || 'archivo';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Descarga iniciada');
  }

  abrirEnlace(url: string): void {
    if (!url) return;
    
    // Asegurarse de que la URL tenga protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    window.open(url, '_blank');
  }

  eliminarEnlace(index: number): void {
    const enlace = this.adjuntos.enlaces[index];
    
    Swal.fire({
      title: '¿Eliminar enlace?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F1416C',
      cancelButtonColor: '#7E8299',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (enlace.id) {
          this.tareaService.deleteAdjunto(this.tareaId, enlace.id).subscribe({
            next: () => {
              this.loadTarea();
              this.TareaE.emit(this.tarea);
              Swal.fire({
                icon: 'success',
                title: 'Enlace eliminado',
                timer: 1200,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('❌ Error al eliminar:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error al eliminar'
              });
            }
          });
        } else {
          this.adjuntos.enlaces.splice(index, 1);
        }
      }
    });
  }

  eliminarArchivo(index: number): void {
    const archivo = this.adjuntos.archivos[index];
    
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F1416C',
      cancelButtonColor: '#7E8299',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (archivo.id) {
          this.tareaService.deleteAdjunto(this.tareaId, archivo.id).subscribe({
            next: () => {
              this.loadTarea();
              this.TareaE.emit(this.tarea);
              Swal.fire({
                icon: 'success',
                title: 'Archivo eliminado',
                timer: 1200,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('❌ Error al eliminar:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error al eliminar'
              });
            }
          });
        } else {
          this.adjuntos.archivos.splice(index, 1);
        }
      }
    });
  }

  obtenerIconoArchivo(tipo: string): string {
    if (!tipo) return 'fa-file';
    
    if (tipo.includes('pdf')) return 'fa-file-pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'fa-file-excel';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'fa-file-powerpoint';
    if (tipo.includes('image')) return 'fa-file-image';
    if (tipo.includes('video')) return 'fa-file-video';
    if (tipo.includes('audio')) return 'fa-file-audio';
    if (tipo.includes('zip') || tipo.includes('rar') || tipo.includes('compressed')) return 'fa-file-zipper';
    if (tipo.includes('text')) return 'fa-file-lines';
    
    return 'fa-file';
  }

  /**
   * 🔧 CORRECCIÓN: Verificar si un archivo puede ser visualizado
   */
  esArchivoVisualizable(archivo: any): boolean {
    if (!archivo || !archivo.tipo) return false;
    
    const tipo = archivo.tipo.toLowerCase();
    
    // Imágenes
    if (tipo.includes('image/') || 
        tipo.includes('jpeg') || 
        tipo.includes('jpg') || 
        tipo.includes('png') || 
        tipo.includes('gif') || 
        tipo.includes('webp') || 
        tipo.includes('svg')) {
      return true;
    }
    
    // PDFs
    if (tipo.includes('pdf')) {
      return true;
    }
    
    return false;
  }

  /**
   * 🔧 CORRECCIÓN: Visualizar archivo en modal o nueva ventana
   */
  visualizarArchivo(archivo: any): void {
    console.log('👁️ Visualizando archivo:', archivo);
    
    if (!archivo.file_url && !archivo.url) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede visualizar el archivo: URL no disponible'
      });
      return;
    }

    const url = archivo.file_url || archivo.url;
    const tipo = archivo.tipo ? archivo.tipo.toLowerCase() : '';

    // Para imágenes, mostrar en modal con Swal
    if (tipo.includes('image')) {
      Swal.fire({
        title: archivo.nombre || 'Imagen',
        imageUrl: url,
        imageAlt: archivo.nombre,
        width: 800,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          image: 'img-fluid'
        }
      });
    } 
    // Para PDFs y otros documentos, abrir en nueva pestaña
    else {
      window.open(url, '_blank');
    }

    console.log('✅ Archivo visualizado correctamente');
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
    
    console.log('💬 Agregando comentario:', this.newComment);
    
    this.tareaService.addComment(this.tareaId, this.newComment).subscribe({
      next: () => {
        console.log('✅ Comentario agregado');
        this.newComment = '';
        this.loadTimeline();
        Swal.fire({ 
          icon: 'success', 
          title: 'Comentario agregado', 
          timer: 1200, 
          showConfirmButton: false 
        });
      },
      error: (error: any) => {
        console.error('❌ Error al agregar comentario:', error);
        Swal.fire({ 
          icon: 'error', 
          title: 'No se pudo agregar el comentario' 
        });
      }
    });
  }

  editComment(commentId: number): void {
    // Implementar edición de comentarios
    console.log('✏️ Editando comentario:', commentId);
  }

  deleteComment(commentId: number): void {
    Swal.fire({
      title: '¿Eliminar comentario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tareaService.deleteComment(this.tareaId, commentId).subscribe({
          next: () => {
            console.log('✅ Comentario eliminado');
            this.loadTimeline();
            Swal.fire({ 
              icon: 'success', 
              title: 'Comentario eliminado', 
              timer: 1200, 
              showConfirmButton: false 
            });
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar comentario:', error);
            Swal.fire({ 
              icon: 'error', 
              title: 'No se pudo eliminar el comentario' 
            });
          }
        });
      }
    });
  }

  getUserAvatar(user: any): string {
    return user?.avatar || this.defaultAvatar;
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
      
      this.loadMiembrosAsignados();
      this.loadTimeline();
      
      // Emitir cambios al componente padre
      this.TareaE.emit(tareaActualizada);
    });
  }

  /**
   * Desasignar un miembro de la tarea
   */
  desasignarMiembro(userId: number) {
    const miembro = this.miembrosAsignados.find(m => m.id === userId);
    const nombreMiembro = miembro ? `${miembro.name} ${miembro.surname || ''}` : 'este miembro';

    Swal.fire({
      title: '¿Desasignar miembro?',
      text: `¿Estás seguro de desasignar a ${nombreMiembro} de esta tarea?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tareaService.unassignMemberFromTarea(this.tareaId, userId).subscribe({
          next: (resp: any) => {
            if (resp.message === 200) {
              this.miembrosAsignados = this.miembrosAsignados.filter(m => m.id !== userId);
              
              Swal.fire({
                icon: 'success',
                title: 'Miembro desasignado',
                text: `${nombreMiembro} ha sido desasignado de la tarea.`,
                timer: 2000,
                showConfirmButton: false
              });
              
              this.loadTimeline();
              this.TareaE.emit(resp.tarea || this.tarea);
            }
          },
          error: (error: any) => {
            console.error('❌ Error al desasignar miembro:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desasignar el miembro. Intenta de nuevo.'
            });
          }
        });
      }
    });
  }
}