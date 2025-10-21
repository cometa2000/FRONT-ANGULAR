import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TareaService } from '../service/tarea.service';
import { BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-edit-tarea',
  templateUrl: './edit-tarea.component.html',
  styleUrls: ['./edit-tarea.component.scss']
})
export class EditTareaComponent implements OnInit, OnChanges {
  @Output() TareaE: EventEmitter<any> = new EventEmitter();
  @Input() TAREA_SELECTED: any;
  @Input() users: any = [];
  @Input() sucursales: any = [];

  name: string = '';
  description: string = '';
  type_task: string = 'simple';
  priority: string = 'medium';
  user_id: number | null = null;
  start_date: any;
  due_date: any;
  estimated_time: string = '';
  file_path: string = '';
  budget: string = '';
  attendees: string = '';
  subtasks: string = '';

  openMenu: string | null = null;
  isLoading: any;
  
  // Variables para comentarios y actividades
  timeline: any[] = [];
  newComment: string = '';
  currentUserId: number = 0;
  currentUserName: string = '';
  currentUserAvatar: string = '';
  isLoadingComment: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoadingTimeline: boolean = false;

  constructor(
    public modal: NgbActiveModal,
    public tareaService: TareaService,
    public toast: ToastrService,
    private cdr: ChangeDetectorRef  
  ) {}

  ngOnInit(): void {
    console.log('🎬 ===== INICIO EditTareaComponent =====');
    
    this.isLoading = this.tareaService.isLoading$;
    
    // ✅ CORREGIDO: Cargar usuario actual primero
    this.loadCurrentUser();
    
    // Luego cargar datos de la tarea
    if (this.TAREA_SELECTED?.id) {
      this.loadTareaData();
      // ✅ CRÍTICO: Agregar pequeño delay para asegurar que el servicio esté listo
      setTimeout(() => {
        this.loadTimelineData();
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['TAREA_SELECTED'] && !changes['TAREA_SELECTED'].firstChange) {
      console.log('🔄 TAREA_SELECTED cambió:', this.TAREA_SELECTED);
      if (this.TAREA_SELECTED?.id) {
        this.loadTareaData();
        this.loadTimelineData();
      }
    }
  }

  // ✅ MEJORADO: Cargar datos del usuario actual desde localStorage
  private loadCurrentUser(): void {
    try {
      const userDataString = localStorage.getItem('user');
      
      if (!userDataString) {
        console.warn('⚠️ No hay datos de usuario en localStorage');
        this.setDefaultUser();
        return;
      }

      const userData = JSON.parse(userDataString);
      
      // ✅ Intentar múltiples formas de obtener el ID
      this.currentUserId = userData.id || userData.user_id || 0;
      this.currentUserName = userData.full_name || userData.name || 'Usuario';
      this.currentUserAvatar = userData.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
      
      console.log('👤 Usuario actual cargado:', {
        id: this.currentUserId,
        name: this.currentUserName,
        avatar: this.currentUserAvatar
      });

      if (this.currentUserId === 0) {
        console.error('❌ No se pudo obtener ID de usuario válido');
      }
      
    } catch (error) {
      console.error('❌ Error al parsear datos del usuario:', error);
      this.setDefaultUser();
    }
  }

  private setDefaultUser(): void {
    this.currentUserId = 0;
    this.currentUserName = 'Usuario';
    this.currentUserAvatar = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  }

  private loadTareaData(): void {
    if (!this.TAREA_SELECTED) return;

    this.name = this.TAREA_SELECTED.name || '';
    this.description = this.TAREA_SELECTED.description || '';
    this.type_task = this.TAREA_SELECTED.type_task || 'simple';
    this.priority = this.TAREA_SELECTED.priority || 'medium';
    this.user_id = this.TAREA_SELECTED.user_id || null;
    this.start_date = this.TAREA_SELECTED.start_date || null;
    this.due_date = this.TAREA_SELECTED.due_date || null;
    this.estimated_time = this.TAREA_SELECTED.estimated_time || '';
    this.file_path = this.TAREA_SELECTED.file_path || '';
    this.budget = this.TAREA_SELECTED.budget || '';
    this.attendees = this.TAREA_SELECTED.attendees || '';
    this.subtasks = this.TAREA_SELECTED.subtasks || '';

    console.log('✅ Datos de tarea cargados');
  }

  // ✅ REFACTORIZADO: Método mejorado para cargar timeline
  private loadTimelineData(): void {
    if (!this.TAREA_SELECTED?.id) {
      console.warn('⚠️ No se puede cargar timeline: falta ID de tarea');
      return;
    }

    console.log('📥 ===== Cargando Timeline =====');
    console.log('📥 Tarea ID:', this.TAREA_SELECTED.id);
    
    this.isLoadingTimeline = true;
    this.timeline = []; // ✅ Limpiar timeline antes de cargar
    
    this.tareaService.getTimeline(this.TAREA_SELECTED.id)
      .pipe(finalize(() => {
        this.isLoadingTimeline = false;
        console.log('🏁 Carga de timeline finalizada');
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (resp: any) => {
          console.log('✅ Respuesta completa recibida:', resp);
          
          if (!resp) {
            console.warn('⚠️ Respuesta vacía');
            this.timeline = [];
            return;
          }

          // ✅ Verificar estructura de respuesta
          if (!resp.timeline || !Array.isArray(resp.timeline)) {
            console.warn('⚠️ Respuesta sin timeline válido:', resp);
            this.timeline = [];
            return;
          }

          // ✅ Mapear y preparar timeline
          this.timeline = resp.timeline.map((item: any) => {
            const mappedItem = {
              ...item,
              isEditing: false,
              editContent: item.type === 'comentario' ? (item.content || '') : '',
              // ✅ Asegurar que user existe
              user: item.user || {
                id: 0,
                name: 'Usuario Desconocido',
                avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
              }
            };
            
            console.log('📝 Item mapeado:', mappedItem);
            return mappedItem;
          });
          
          console.log('✅ Timeline procesado exitosamente:', {
            total: this.timeline.length,
            comentarios: this.timeline.filter(i => i.type === 'comentario').length,
            actividades: this.timeline.filter(i => i.type === 'actividad').length,
            items: this.timeline
          });

          // ✅ Forzar detección de cambios
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error al cargar timeline:', err);
          console.error('❌ Detalles del error:', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error
          });
          this.toast.error('Error al cargar comentarios y actividades', 'Error');
          this.timeline = [];
          this.cdr.detectChanges();
        }
      });
  }

  loadTimeline(): void {
    this.loadTimelineData();
  }

  toggleMenu(menu: string) {
    this.openMenu = this.openMenu === menu ? null : menu;
  }
  
  addComment() {
    console.log('💬 ===== Agregando comentario =====');
    
    if (!this.newComment || this.newComment.trim().length === 0) {
      this.toast.warning('Escribe un comentario', 'Validación');
      return;
    }

    if (!this.TAREA_SELECTED?.id) {
      this.toast.error('Error: No hay tarea seleccionada', 'Error');
      return;
    }

    console.log('💬 Contenido:', this.newComment);
    console.log('💬 Tarea ID:', this.TAREA_SELECTED.id);
    
    this.isLoadingComment.next(true);
    
    this.tareaService.addComment(this.TAREA_SELECTED.id, this.newComment)
      .pipe(finalize(() => this.isLoadingComment.next(false)))
      .subscribe({
        next: (resp: any) => {
          console.log('✅ Comentario agregado:', resp);
          
          if (resp.message === 200) {
            this.toast.success('Comentario agregado', 'Éxito');
            this.newComment = '';
            
            // ✅ Recargar timeline después de agregar comentario
            this.loadTimelineData();
          } else {
            this.toast.error('Error al agregar comentario', 'Error');
          }
        },
        error: (err) => {
          console.error('❌ Error al agregar comentario:', err);
          this.toast.error('Error al agregar comentario', 'Error');
        }
      });
  }

  editComment(item: any) {
    item.isEditing = true;
    item.editContent = item.content;
  }

  cancelEditComment(item: any) {
    item.isEditing = false;
    item.editContent = item.content;
  }

  saveEditComment(item: any) {
    if (!item.editContent || item.editContent.trim().length === 0) {
      this.toast.warning('El comentario no puede estar vacío', 'Validación');
      return;
    }

    this.tareaService.updateComment(
      this.TAREA_SELECTED.id, 
      item.id, 
      item.editContent
    ).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.toast.success('Comentario actualizado', 'Éxito');
          item.content = item.editContent;
          item.is_edited = true;
          item.isEditing = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al actualizar comentario:', err);
        this.toast.error('Error al actualizar comentario', 'Error');
      }
    });
  }

  deleteComment(comentarioId: number) {
    if (confirm('¿Estás seguro de eliminar este comentario?')) {
      this.tareaService.deleteComment(this.TAREA_SELECTED.id, comentarioId).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.toast.success('Comentario eliminado', 'Éxito');
            this.timeline = this.timeline.filter(item => item.id !== comentarioId);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error al eliminar comentario:', err);
          this.toast.error('Error al eliminar comentario', 'Error');
        }
      });
    }
  }

  store() {
    if (!this.name || this.name.trim().length === 0) {
      this.toast.error('El nombre de la tarea es requerido', 'Validación');
      return;
    }

    let data = {
      name: this.name,
      description: this.description,
      type_task: this.type_task,
      priority: this.priority,
      user_id: this.user_id,
      start_date: this.start_date,
      due_date: this.due_date,
      estimated_time: this.estimated_time,
      budget: this.budget,
      attendees: this.attendees,
      subtasks: this.subtasks,
      file_path: this.file_path
    };

    this.tareaService.updateTarea(this.TAREA_SELECTED.id, data)
      .subscribe({
        next: (resp: any) => {
          if (resp.message == 403) {
            this.toast.error(resp.message_text, 'Validación');
          } else {
            this.toast.success('La tarea se editó correctamente', 'Éxito');
            this.TareaE.emit(resp.tarea);
            
            // ✅ Recargar timeline para mostrar actividades
            this.loadTimelineData();
          }
        },
        error: (err) => {
          console.error('Error al editar tarea:', err);
          this.toast.error('Error al editar la tarea', 'Error');
        }
      });
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
