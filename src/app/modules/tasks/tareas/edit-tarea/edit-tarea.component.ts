import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TareaService } from '../service/tarea.service';
import { ChecklistsService } from '../service/checklists.service';

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
}

@Component({
  selector: 'app-edit-tarea',
  templateUrl: './edit-tarea.component.html',
  styleUrls: ['./edit-tarea.component.scss']
})
export class EditTareaComponent implements OnInit {

  // ←—— cuando se abre como modal desde ListTarea
  @Input() TAREA_SELECTED?: { id: number };

  // ←—— opcional: si el padre inyecta usuarios para los avatares
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

  // Propiedades para edición
  editingDescription = false;
  newComment = '';
  timeline: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    private checklistsService: ChecklistsService
  ) {}

  ngOnInit(): void {
    console.log('🎯 Iniciando EditTareaComponent');
    
    // 1) Prioriza el ID que llega por @Input() (modal)
    if (this.TAREA_SELECTED?.id) {
      this.tareaId = Number(this.TAREA_SELECTED.id);
      console.log('📌 ID desde @Input:', this.tareaId);
    } else {
      // 2) fallback: ID por ruta (si alguna vez entras navegando)
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
          
          // Inicializar propiedades de checklists para el UI
          if (this.tarea && this.tarea.checklists) {
            this.tarea.checklists.forEach(checklist => {
              checklist.addingItem = false;
              checklist.newItemName = '';
            });
          }
          
          console.log('✅ Tarea cargada correctamente:', this.tarea);
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
  // 🏷️ ETIQUETAS
  // =============================
  getEtiquetaColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#61bd4f': 'green',
      '#f2d600': 'yellow',
      '#ff9f1a': 'orange',
      '#eb5a46': 'red',
      '#c377e0': 'purple',
      '#0079bf': 'blue',
      '#00c2e0': 'sky',
      '#51e898': 'lime',
      '#ff78cb': 'pink',
      '#344563': 'black',
      'green': 'green',
      'yellow': 'yellow',
      'orange': 'orange',
      'red': 'red',
      'purple': 'purple',
      'blue': 'blue',
      'sky': 'sky',
      'lime': 'lime',
      'pink': 'pink',
      'black': 'black'
    };
    
    return colorMap[color.toLowerCase()] || 'blue';
  }

  // =============================
  // ✅ CHECKLISTS
  // =============================
  getChecklistProgress(checklist: any): number {
    if (!checklist.items || checklist.items.length === 0) {
      return 0;
    }
    
    const completedItems = checklist.items.filter((item: any) => item.completed).length;
    return Math.round((completedItems / checklist.items.length) * 100);
  }

  toggleChecklistItem(checklistId: number, itemId: number): void {
    console.log('🔄 Toggle item:', checklistId, itemId);
    
    this.checklistsService.updateItem(this.tareaId, checklistId, itemId, { completed: true }).subscribe({
      next: () => {
        console.log('✅ Item actualizado');
        this.loadTarea();
      },
      error: (error: any) => {
        console.error('❌ Error al actualizar item:', error);
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
      text: 'Esta acción no se puede deshacer',
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
    // Encontrar el comentario
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
    // Aquí puedes implementar un menú desplegable con opciones
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

  /**
   * Cerrar la modal (si aplica)
   */
  closeModal(): void {
    // Si está en una ruta directa, navegar de vuelta
    if (!this.TAREA_SELECTED?.id) {
      this.router.navigate(['/tasks']);
    }
    // Si es un modal, el padre debe escuchar y cerrar
    // (puedes emitir un evento con @Output si lo necesitas)
  }
}