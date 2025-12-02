import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { GrupoService } from '../../grupos/service/grupo.service';
import { CreateTareaComponent } from '../create-tarea/create-tarea.component';
import { EditTareaComponent } from '../edit-tarea/edit-tarea.component';
import { DeleteTareaComponent } from '../delete-tarea/delete-tarea.component';
import { CreateListaComponent } from '../create-lista/create-lista.component';
import { EditListaComponent } from '../edit-lista/edit-lista.component';
import { DelteListaComponent } from '../delte-lista/delte-lista.component';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tablero-tareas',
  templateUrl: './tablero-tareas.component.html',
  styleUrls: ['./tablero-tareas.component.scss']
})
export class TableroTareasComponent implements OnInit {
  grupo_id!: number;
  GRUPO_SELECTED: any = null;
  LISTAS: any[] = [];
  isLoading$: any;
  sucursales: any = [];
  users: any = [];

  openMenuId: number | null = null;

  // ✅ CAMBIO: Inicializar como false por seguridad hasta verificar permisos
  hasWriteAccess: boolean = false;
  isOwner: boolean = false; 
  // ✅ NUEVO: Flag para saber si ya se cargaron los permisos
  permissionsLoaded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public modalService: NgbModal,
    public tareaService: TareaService,
    public grupoService: GrupoService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.tareaService.isLoading$;

    this.route.params.subscribe(params => {
      this.grupo_id = +params['grupo_id'];
      
      if (this.grupo_id) {
        // ✅ CAMBIO: Verificar permisos PRIMERO antes de cargar nada
        this.checkWritePermissions(() => {
          // Solo después de verificar permisos, cargar los datos
          this.loadGrupoData();
          this.listListas();
          this.configAll();
        });
      } else {
        this.toastr.warning('No se proporcionó un grupo válido', 'Advertencia');
        this.router.navigate(['/tasks/grupos/list']);
      }
    });
  }

  // ✅ MEJORADO: Verificar permisos con callback para ejecutar después
  checkWritePermissions(callback?: () => void) {
    if (this.grupo_id) {
      this.grupoService.checkWriteAccess(this.grupo_id).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.hasWriteAccess = resp.has_write_access;
            this.isOwner = resp.is_owner;
            this.permissionsLoaded = true;
            
            // ✅ NUEVO: Mostrar mensaje si es solo lectura
            if (!this.hasWriteAccess && !this.isOwner) {
              console.log('👁️ Usuario tiene solo permisos de lectura');
              this.toastr.info('Tienes permisos de solo lectura en este grupo', 'Información', {
                timeOut: 4000
              });
            }
            
            // ✅ Forzar detección de cambios para actualizar la vista
            this.cdr.detectChanges();
            
            // Ejecutar callback si existe
            if (callback) {
              callback();
            }
          }
        },
        error: (err: any) => {
          console.error('Error al verificar permisos:', err);
          this.hasWriteAccess = false;
          this.permissionsLoaded = true;
          this.toastr.error('Error al verificar permisos de acceso', 'Error');
          // Aún así ejecutar el callback para cargar los datos en modo lectura
          if (callback) {
            callback();
          }
        }
      });
    }
  }

  loadGrupoData() {
    this.grupoService.listGrupos(1, '').subscribe((resp: any) => {
      this.GRUPO_SELECTED = resp.grupos.find((g: any) => g.id === this.grupo_id);
      
      if (!this.GRUPO_SELECTED) {
        this.toastr.error('El grupo no existe o no tienes acceso', 'Error');
        this.router.navigate(['/tasks/grupos/list']);
      }
    });
  }

  toggleMenu(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-dropdown') && !target.closest('.btn-icon')) {
      this.openMenuId = null;
    }
  }

  toggleTaskExpand(tarea: any, event: MouseEvent) {
    event.stopPropagation();
    tarea.expanded = !tarea.expanded;
  }

  // ✅ MEJORADO: Verificar permisos antes de permitir reordenar
  onListDrop(event: CdkDragDrop<any[]>) {
    // ✅ NUEVO: Verificación adicional de permisos
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para reordenar listas', 'Permiso denegado');
      return;
    }

    if (event.previousIndex === event.currentIndex) {
      return;
    }

    console.log('📋 Moviendo lista:', {
      from: event.previousIndex,
      to: event.currentIndex
    });

    moveItemInArray(this.LISTAS, event.previousIndex, event.currentIndex);

    const updatedListas = this.LISTAS.map((lista, index) => ({
      id: lista.id,
      orden: index
    }));

    this.saveListOrder(updatedListas);
  }

  saveListOrder(listas: { id: number, orden: number }[]) {
    this.tareaService.reorderListas(listas).subscribe({
      next: (resp: any) => {
        console.log('✅ Orden guardado correctamente');

        Swal.fire({
          icon: 'success',
          title: 'Orden actualizado',
          text: 'Las listas fueron reordenadas correctamente',
          timer: 2000,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al guardar orden:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el nuevo orden',
          toast: true,
          position: 'top-end',
          timer: 2500,
          showConfirmButton: false
        });

        this.listListas();
      }
    });
  }


  getConnectedLists(): string[] {
    return this.LISTAS.map(lista => 'lista-' + lista.id);
  }

  // ✅ MEJORADO: Verificar permisos antes de permitir mover tareas
  onTaskDrop(event: CdkDragDrop<any[]>, targetList: any) {
    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para mover tareas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(targetList.tareas, event.previousIndex, event.currentIndex);
    } else {
      const prevList = this.LISTAS.find(l => l.tareas === event.previousContainer.data);
      if (!prevList) return;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const movedTask = targetList.tareas[event.currentIndex];
      const oldListId = movedTask.lista_id;
      const newListId = targetList.id;

      movedTask.lista_id = newListId;
      movedTask.lista = { id: newListId, name: targetList.name };

      this.tareaService.moveTarea(movedTask.id, newListId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Tarea movida',
            text: `Ahora está en "${targetList.name}"`,
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo mover la tarea',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false
          });

          console.error('Error al mover tarea:', error);

          movedTask.lista_id = oldListId;

          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
        }
      });
    }

    this.cdr.detectChanges();
  }


  // ✅ MEJORADO: Verificar permisos antes de crear lista
  createLista() {
    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para crear listas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    const modalRef = this.modalService.open(CreateListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.grupo_id = this.grupo_id;

    modalRef.componentInstance.ListaC.subscribe((lista: any) => {
      lista.tareas = [];
      lista.orden = this.LISTAS.length;
      this.LISTAS.push(lista);

      Swal.fire({
        icon: 'success',
        title: 'Lista creada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      this.cdr.detectChanges();
      modalRef.close();
    });
  }



  // ✅ MEJORADO: Verificar permisos antes de crear tarea
  createTarea(listaId: number) {
    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para crear tareas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    const modalRef = this.modalService.open(CreateTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.lista_id = listaId;
    modalRef.componentInstance.grupo_id = this.grupo_id;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.sucursales = this.sucursales;

    modalRef.componentInstance.TareaC.subscribe((tarea: any) => {
      const targetList = this.LISTAS.find(l => l.id === listaId);
      if (targetList) {
        tarea.expanded = false;
        targetList.tareas.push(tarea);

        Swal.fire({
          icon: 'success',
          title: 'Tarea creada',
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false
        });

        this.cdr.detectChanges();
      }
    });
  }


  // ✅ MEJORADO: Pasar permisos al modal de edición
  editTarea(TAREA: any) {
    const modalRef = this.modalService.open(EditTareaComponent, { centered: true, size: 'xl' });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.sucursales = this.sucursales;
    modalRef.componentInstance.grupo_id = this.grupo_id;
    modalRef.componentInstance.hasWriteAccess = this.hasWriteAccess;
    modalRef.componentInstance.isOwner = this.isOwner;

    modalRef.componentInstance.TareaE.subscribe((tareaEditada: any) => {
      this.LISTAS.forEach(lista => {
        const index = lista.tareas.findIndex((t: any) => t.id === tareaEditada.id);
        if (index !== -1) {
          lista.tareas[index] = { ...lista.tareas[index], ...tareaEditada };
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'Tarea actualizada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      this.cdr.detectChanges();
    });
  }


  // ✅ MEJORADO: Verificar permisos antes de editar lista
  editLista(LISTA: any) {
    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para editar listas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    const modalRef = this.modalService.open(EditListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;

    modalRef.componentInstance.ListaE.subscribe((listaEditada: any) => {
      const index = this.LISTAS.findIndex(l => l.id === listaEditada.id);
      if (index !== -1) {
        this.LISTAS[index] = { ...this.LISTAS[index], ...listaEditada };
      }

      Swal.fire({
        icon: 'success',
        title: 'Lista actualizada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      this.cdr.detectChanges();
    });
  }


  // ✅ MEJORADO: Verificar permisos antes de eliminar tarea
  deleteTarea(TAREA: any, event?: MouseEvent) {
    if (event) event.stopPropagation();

    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para eliminar tareas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    const modalRef = this.modalService.open(DeleteTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;

    modalRef.componentInstance.TareaD.subscribe(() => {
      this.LISTAS.forEach(list => {
        list.tareas = list.tareas.filter((t: any) => t.id !== TAREA.id);
      });

      Swal.fire({
        icon: 'success',
        title: 'Tarea eliminada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      this.cdr.detectChanges();
    });
  }


  // ✅ MEJORADO: Verificar permisos antes de eliminar lista
  deleteLista(LISTA: any) {
    if (!this.hasWriteAccess) {
      Swal.fire({
        icon: 'warning',
        title: 'Permiso denegado',
        text: 'No tienes permisos para eliminar listas',
        toast: true,
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false
      });
      return;
    }

    const modalRef = this.modalService.open(DelteListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;

    modalRef.componentInstance.ListaD.subscribe(() => {
      this.LISTAS = this.LISTAS.filter((l: any) => l.id !== LISTA.id);

      Swal.fire({
        icon: 'success',
        title: 'Lista eliminada',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      this.cdr.detectChanges();
    });
  }


  listListas() {
    this.tareaService.listListas(this.grupo_id).subscribe({
      next: (resp: any) => {
        console.log('📋 ===== RESPUESTA DE listListas =====');
        console.log('📋 Listas recibidas:', resp.listas?.length || 0);
        
        if (resp.listas && resp.listas[0]?.tareas && resp.listas[0].tareas[0]) {
          const primeraLista = resp.listas[0];
          const primeraTarea = primeraLista.tareas[0];
          
          console.log('🔍 Estructura de primera tarea:', {
            id: primeraTarea.id,
            name: primeraTarea.name,
            status: primeraTarea.status,
            priority: primeraTarea.priority,
            tiene_etiquetas: !!primeraTarea.etiquetas,
            num_etiquetas: primeraTarea.etiquetas?.length || 0,
            tiene_adjuntos: !!primeraTarea.adjuntos,
            estructura_adjuntos: primeraTarea.adjuntos,
            tiene_checklists: !!primeraTarea.checklists,
            num_checklists: primeraTarea.checklists?.length || 0,
            tiene_comentarios: primeraTarea.comentarios !== undefined,
            num_comentarios: primeraTarea.comentarios?.length || primeraTarea.comentarios_count || 0,
            tiene_user: !!primeraTarea.user,
            user_data: primeraTarea.user
          });
        }
        
        this.LISTAS = resp.listas.map((lista: any) => ({
          ...lista,
          tareas: (lista.tareas || []).map((tarea: any) => {
            const adjuntos = tarea.adjuntos || { archivos: [], enlaces: [] };
            
            if (Array.isArray(adjuntos)) {
              tarea.adjuntos = { archivos: [], enlaces: [] };
            } else {
              tarea.adjuntos = {
                archivos: adjuntos.archivos || [],
                enlaces: adjuntos.enlaces || []
              };
            }
            
            if (!Array.isArray(tarea.etiquetas)) {
              tarea.etiquetas = [];
            }
            
            if (!Array.isArray(tarea.checklists)) {
              tarea.checklists = [];
            }
            
            if (tarea.comentarios_count === undefined) {
              tarea.comentarios_count = tarea.comentarios?.length || 0;
            }
            
            // 🆕 SOLUCIÓN: Procesar miembros asignados
            if (!Array.isArray(tarea.assigned_members)) {
              tarea.assigned_members = [];
            }
            
            console.log(`✅ Tarea procesada: ${tarea.name}`, {
              etiquetas: tarea.etiquetas.length,
              adjuntos: tarea.adjuntos.archivos.length + tarea.adjuntos.enlaces.length,
              checklists: tarea.checklists.length,
              comentarios: tarea.comentarios_count,
              miembros: tarea.assigned_members.length
            });
            
            return {
              ...tarea,
              expanded: false
            };
          })
        }));
        
        console.log('✅ Listas procesadas correctamente');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar listas:', error);
        this.toastr.error('No se pudieron cargar las listas', 'Error');
      }
    });
  }

  configAll() {
    this.tareaService.configAll().subscribe((resp: any) => {
      this.users = resp.users;
      this.sucursales = resp.sucursales;
    });
  }

  closeMenuAnd(actionName: string, data?: any) {
    this.openMenuId = null;

    switch (actionName) {
      case 'editLista':
        this.editLista(data);
        break;
      case 'deleteLista':
        this.deleteLista(data);
        break;
    }
  }

  volverAGrupos() {
    this.router.navigate(['/tasks/grupos/list']);
  }

  tieneIndicadores(tarea: any): boolean {
    return (
      this.getTotalAdjuntos(tarea) > 0 ||
      this.getTotalChecklistItems(tarea) > 0 ||
      this.getTotalComentarios(tarea) > 0 ||
      (tarea.assigned_members && tarea.assigned_members.length > 0)
    );
  }

  getTotalAdjuntos(tarea: any): number {
    if (!tarea.adjuntos) return 0;
    
    const archivos = tarea.adjuntos.archivos?.length || 0;
    const enlaces = tarea.adjuntos.enlaces?.length || 0;
    
    return archivos + enlaces;
  }

  getTotalChecklistItems(tarea: any): number {
    if (!tarea.checklists || !Array.isArray(tarea.checklists)) return 0;
    
    return tarea.checklists.reduce((total: number, checklist: any) => {
      return total + (checklist.items?.length || 0);
    }, 0);
  }

  getCompletedChecklistItems(tarea: any): number {
    if (!tarea.checklists || !Array.isArray(tarea.checklists)) return 0;
    
    return tarea.checklists.reduce((total: number, checklist: any) => {
      if (!checklist.items) return total;
      
      const completados = checklist.items.filter((item: any) => item.completed).length;
      return total + completados;
    }, 0);
  }

  getChecklistProgress(tarea: any): number {
    const total = this.getTotalChecklistItems(tarea);
    if (total === 0) return 0;
    
    const completados = this.getCompletedChecklistItems(tarea);
    return Math.round((completados / total) * 100);
  }

  isChecklistCompleted(tarea: any): boolean {
    const total = this.getTotalChecklistItems(tarea);
    if (total === 0) return false;
    
    return this.getCompletedChecklistItems(tarea) === total;
  }

  getTotalComentarios(tarea: any): number {
    if (tarea.comentarios && Array.isArray(tarea.comentarios)) {
      return tarea.comentarios.length;
    }
    
    if (tarea.comentarios_count !== undefined) {
      return tarea.comentarios_count;
    }
    
    return 0;
  }

  onAvatarError(event: any): void {
    console.error('❌ Error al cargar avatar, usando fallback');
    event.target.src = 'assets/media/avatars/blank.png';
  }

  /**
   * 🎨 Obtener la ruta correcta del avatar de un miembro
   */
  getMemberAvatar(member: any): string {
    if (member?.avatar) {
      return this.getAvatarUrl(member.avatar);
    }

    return 'assets/media/avatars/blank.png';
  }


  /**
   * 🔧 Helper genérico para construir la URL del avatar
   * Maneja los formatos: "1.png", "2.png", URLs completas, y rutas storage
   */
  private getAvatarUrl(avatarValue: string): string {
    if (!avatarValue) {
      return 'assets/media/avatars/blank.png';
    }

    // 🆕 Caso: solo el número sin extensión (ej. "3")
    if (/^\d+$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}.png`;
    }

    // Caso: formato nuevo "3.png"
    if (/^\d+\.png$/.test(avatarValue)) {
      return `assets/media/avatars/${avatarValue}`;
    }

    // Caso: URL completa
    if (avatarValue.includes('http') || avatarValue.includes('storage')) {
      return avatarValue;
    }

    // Caso general: intentar construir ruta
    return `assets/media/avatars/${avatarValue}`;
  }

}