import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TareaService } from '../service/tarea.service';
import { ChecklistsService } from '../service/checklists.service';
import { EtiquetasService, Etiqueta } from '../service/etiquetas.service';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdjuntarModalComponent, Enlace, Archivo } from '../adjuntar-modal/adjuntar-modal.component';

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

  tareaId!: number;
  tarea: Tarea | null = null;

  // UI helpers
  defaultAvatar = 'assets/media/avatars/blank.png';
  sectionsOpen = {
    descripcion: true,
    etiquetas: true,
    checklists: true,
    comentarios: true,
    actividad: true
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

  constructor(
    public modal: NgbActiveModal,
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private checklistsService: ChecklistsService,
    private etiquetasService: EtiquetasService,
    private modalService: NgbModal
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
  }

  // =============================
  // 🧱 CARGA DE TAREA
  // =============================
  loadTarea(): void {
    console.log('🔄 Llamando a tareaService.show con ID:', this.tareaId);
    
    this.tareaService.show(String(this.tareaId)).subscribe({
      next: (resp) => {
        console.log('✅ Respuesta recibida del servidor:', resp);
        
        if (resp && resp.tarea) {
          this.tarea = resp.tarea;
          
          if (this.tarea && this.tarea.checklists) {
            this.tarea.checklists.forEach(checklist => {
              checklist.addingItem = false;
              checklist.newItemName = '';
            });
          }

          if (this.tarea && this.tarea.adjuntos) {
            this.adjuntos = {
              enlaces: this.tarea.adjuntos.enlaces || [],
              archivos: this.tarea.adjuntos.archivos || []
            };
          }
          
          console.log('✅ Tarea cargada correctamente:', this.tarea);
          console.log('📎 Adjuntos cargados:', this.adjuntos);
        } else {
          console.error('❌ Estructura de respuesta inesperada:', resp);
          this.tarea = null;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'La respuesta del servidor no tiene el formato esperado',
            confirmButtonColor: '#EB5A46'
          });
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar la tarea:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la tarea. ' + (error.error?.message || 'Verifica tu conexión e intenta nuevamente.'),
          confirmButtonColor: '#EB5A46'
        });
      }
    });
  }

  // =============================
  // 📎 MÉTODOS DE ADJUNTOS
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

  guardarArchivo(archivo: Archivo): void {
    if (!this.tarea) return;

    const formData = new FormData();
    formData.append('tipo', 'archivo');
    if (archivo.file) {
      formData.append('file', archivo.file);
    }

    this.tareaService.addAdjunto(this.tareaId, formData).subscribe({
      next: (resp) => {
        console.log('✅ Archivo guardado:', resp);
        this.loadTarea();
        Swal.fire({
          icon: 'success',
          title: 'Archivo adjuntado',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al guardar archivo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al adjuntar archivo'
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
    if (tipo.startsWith('image/')) return 'fa-file-image';
    if (tipo === 'application/pdf') return 'fa-file-pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'fa-file-word';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'fa-file-excel';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'fa-file-powerpoint';
    return 'fa-file';
  }

  abrirEnlace(url: string): void {
    window.open(url, '_blank');
  }

  tiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaAdjunto = new Date(fecha);
    const diferencia = ahora.getTime() - fechaAdjunto.getTime();
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);
    
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
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
  // 📅 FECHAS
  // =============================
  toggleEditFechas(): void {
    this.editingFechas = true;
    
    if (this.tarea?.start_date) {
      this.startDate = this.tarea.start_date;
    }
    if (this.tarea?.due_date) {
      this.dueDate = this.tarea.due_date;
    }
  }

  cancelEditFechas(): void {
    this.editingFechas = false;
    this.startDate = '';
    this.dueDate = '';
  }

  saveFechas(): void {
    if (!this.startDate || !this.dueDate) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Completa ambas fechas',
        text: 'Debes ingresar fecha de inicio y vencimiento'
      });
      return;
    }

    const data = {
      start_date: this.startDate,
      due_date: this.dueDate
    };

    this.tareaService.updateTarea(this.tareaId, data).subscribe({
      next: () => {
        console.log('✅ Fechas guardadas');
        this.editingFechas = false;
        this.loadTarea();
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
    if (!this.editingEtiqueta || !this.etiquetaName.trim()) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'El nombre es requerido' 
      });
      return;
    }

    if (!this.editingEtiqueta.id) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error',
        text: 'ID de etiqueta inválido'
      });
      return;
    }

    const data = {
      name: this.etiquetaName.trim(),
      color: this.selectedColor
    };

    this.etiquetasService.updateEtiqueta(this.tareaId, this.editingEtiqueta.id, data).subscribe({
      next: () => {
        console.log('✅ Etiqueta actualizada');
        this.closeEtiquetaModal();
        this.loadTarea();
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
    if (!etiqueta.id) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error',
        text: 'ID de etiqueta inválido'
      });
      return;
    }

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
  // ✅ CHECKLISTS
  // =============================
  
  getChecklistProgress(checklist: any): number {
    if (!checklist || !checklist.items || checklist.items.length === 0) {
      return 0;
    }
    
    const completedItems = checklist.items.filter((item: any) => item.completed).length;
    const totalItems = checklist.items.length;
    
    return Math.round((completedItems / totalItems) * 100);
  }

  toggleChecklistItem(checklistId: number, item: any): void {
    console.log('🔄 Cambiando estado de item:', item);
    
    const newCompletedState = !item.completed;
    
    this.checklistsService.updateItem(this.tareaId, checklistId, item.id, {
      completed: newCompletedState
    }).subscribe({
      next: () => {
        console.log('✅ Item actualizado');
        item.completed = newCompletedState;
        this.loadTarea();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar item:', error);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar el elemento'
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
            Swal.fire({
              icon: 'success',
              title: 'Checklist eliminado',
              timer: 1200,
              showConfirmButton: false
            });
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
            Swal.fire({
              icon: 'success',
              title: 'Elemento eliminado',
              timer: 1200,
              showConfirmButton: false
            });
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
        Swal.fire({
          icon: 'success',
          title: 'Elemento agregado',
          timer: 1200,
          showConfirmButton: false
        });
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

  editComment(comentarioId: number): void {
    const comment = this.timeline.find(item => 
      item.type === 'comentario' && item.id === comentarioId
    );
    
    if (!comment) return;

    Swal.fire({
      title: 'Editar comentario',
      input: 'textarea',
      inputValue: comment.content,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0079bf',
      inputValidator: (value) => {
        if (!value) {
          return 'El comentario no puede estar vacío';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.tareaService.updateComment(this.tareaId, comentarioId, result.value).subscribe({
          next: () => {
            this.loadTimeline();
            Swal.fire({
              icon: 'success',
              title: 'Comentario actualizado',
              timer: 1200,
              showConfirmButton: false
            });
          },
          error: (error: any) => {
            console.error('❌ Error al editar comentario:', error);
            Swal.fire({
              icon: 'error',
              title: 'No se pudo editar el comentario'
            });
          }
        });
      }
    });
  }

  deleteComment(comentarioId: number): void {
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
        this.tareaService.deleteComment(this.tareaId, comentarioId).subscribe({
          next: () => {
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

  // =============================
  // 🧩 UI
  // =============================
  openAdd(): void {
    console.log('🔧 Abrir menú de añadir');
  }

  toggleSection(key: keyof typeof this.sectionsOpen): void {
    this.sectionsOpen[key] = !this.sectionsOpen[key];
  }

  // =============================
  // 🖼️ AVATAR FALLBACK
  // =============================
  onAvatarError(e: any) {
    if (e && e.target) e.target.src = this.defaultAvatar;
  }

  // =============================
  // 🗑️ ELIMINAR TAREA
  // =============================
  deleteTarea() {
    Swal.fire({
      title: '¿Eliminar tarea?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.tareaService.deleteTarea(String(this.tareaId)).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Tarea eliminada',
              timer: 1200,
              showConfirmButton: false
            });
            this.router.navigate(['/tasks']);
          },
          error: (error: any) => {
            console.error('❌ Error al eliminar tarea:', error);
            Swal.fire({
              icon: 'error',
              title: 'No se pudo eliminar la tarea'
            });
          }
        });
      }
    });
  }

  closeModal(): void {
    this.modal.close();
  }
}