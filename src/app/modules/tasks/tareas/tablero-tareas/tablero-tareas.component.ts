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
        this.loadGrupoData();
        this.listListas();
        this.configAll();
      } else {
        this.toastr.warning('No se proporcionó un grupo válido', 'Advertencia');
        this.router.navigate(['/tasks/grupos/list']);
      }
    });
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

  // ✅ NUEVO: Manejo mejorado de drop de listas con snap
  onListDrop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) {
      return; // No cambió de posición
    }

    console.log('📋 Moviendo lista:', {
      from: event.previousIndex,
      to: event.currentIndex
    });

    // Mover en el array local
    moveItemInArray(this.LISTAS, event.previousIndex, event.currentIndex);

    // Actualizar el campo 'orden' de cada lista
    const updatedListas = this.LISTAS.map((lista, index) => ({
      id: lista.id,
      orden: index
    }));

    // Guardar en el servidor
    this.saveListOrder(updatedListas);
  }

  // ✅ NUEVO: Guardar orden de listas
  saveListOrder(listas: { id: number, orden: number }[]) {
    this.tareaService.reorderListas(listas).subscribe({
      next: (resp: any) => {
        console.log('✅ Orden guardado correctamente');
        this.toastr.success('Orden de listas actualizado', 'Éxito');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al guardar orden:', error);
        this.toastr.error('No se pudo guardar el orden', 'Error');
        // Recargar listas para restaurar el orden original
        this.listListas();
      }
    });
  }

  getConnectedLists(): string[] {
    return this.LISTAS.map(lista => 'lista-' + lista.id);
  }
  // 🔄 Manejo de drop de tareas con actualización de lista_id
  onTaskDrop(event: CdkDragDrop<any[]>, targetList: any) {
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
        next: (resp: any) => {
          this.toastr.success(
            `Tarea movida a "${targetList.name}"`, 
            'Tarea actualizada'
          );
        },
        error: (error) => {
          this.toastr.error('Error al mover la tarea', 'Error');
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

  createLista() {
    const modalRef = this.modalService.open(CreateListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.grupo_id = this.grupo_id;
    
    modalRef.componentInstance.ListaC.subscribe((lista: any) => {
      lista.tareas = [];
      lista.orden = this.LISTAS.length;
      this.LISTAS.push(lista);
      this.toastr.success('Lista creada exitosamente', 'Éxito');
      this.cdr.detectChanges();
    });
  }

  createTarea(listaId: number) {
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
        this.toastr.success('Tarea creada exitosamente', 'Éxito');
        this.cdr.detectChanges();
      }
    });
  }

  editTarea(TAREA: any) {
    const modalRef = this.modalService.open(EditTareaComponent, { 
      centered: true, 
      size: 'xl'
    });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.sucursales = this.sucursales;
    
    modalRef.componentInstance.TareaE.subscribe((tareaEditada: any) => {
      this.LISTAS.forEach(lista => {
        const index = lista.tareas.findIndex((t: any) => t.id === tareaEditada.id);
        if (index !== -1) {
          lista.tareas[index] = { ...tareaEditada, expanded: lista.tareas[index].expanded };
        }
      });
      this.toastr.success('Tarea actualizada correctamente', 'Éxito');
      this.cdr.detectChanges();
    });
  }

  editLista(LISTA: any) {
    const modalRef = this.modalService.open(EditListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;
    
    modalRef.componentInstance.ListaE.subscribe((listaEditada: any) => {
      const index = this.LISTAS.findIndex(l => l.id === listaEditada.id);
      if (index !== -1) {
        this.LISTAS[index] = { ...this.LISTAS[index], ...listaEditada };
      }
      this.toastr.success('Lista actualizada correctamente', 'Éxito');
      this.cdr.detectChanges();
    });
  }

  deleteTarea(TAREA: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    
    const modalRef = this.modalService.open(DeleteTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;
    
    modalRef.componentInstance.TareaD.subscribe(() => {
      this.LISTAS.forEach(list => {
        list.tareas = list.tareas.filter((t: any) => t.id !== TAREA.id);
      });
      this.toastr.success('Tarea eliminada correctamente', 'Éxito');
      this.cdr.detectChanges();
    });
  }

  deleteLista(LISTA: any) {
    const modalRef = this.modalService.open(DelteListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;
    
    modalRef.componentInstance.ListaD.subscribe(() => {
      this.LISTAS = this.LISTAS.filter((l: any) => l.id !== LISTA.id);
      this.toastr.success('Lista eliminada correctamente', 'Éxito');
      this.cdr.detectChanges();
    });
  }

  // listListas() {
  //   this.tareaService.listListas(this.grupo_id).subscribe({
  //     next: (resp: any) => {
  //       this.LISTAS = resp.listas.map((lista: any) => ({
  //         ...lista,
  //         tareas: (lista.tareas || []).map((tarea: any) => ({
  //           ...tarea,
  //           expanded: false
  //         }))
  //       }));
  //       this.cdr.detectChanges();
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar listas:', error);
  //       this.toastr.error('No se pudieron cargar las listas', 'Error');
  //     }
  //   });
  // }

  listListas() {
    this.tareaService.listListas(this.grupo_id).subscribe({
      next: (resp: any) => {
        console.log('📋 ===== RESPUESTA DE listListas =====');
        console.log('📋 Listas recibidas:', resp.listas?.length || 0);
        
        // Verificar estructura de datos de la primera tarea (si existe)
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
            // Asegurar que la estructura de adjuntos esté correcta
            const adjuntos = tarea.adjuntos || { archivos: [], enlaces: [] };
            
            // Si adjuntos es un array vacío, convertirlo a objeto
            if (Array.isArray(adjuntos)) {
              tarea.adjuntos = { archivos: [], enlaces: [] };
            } else {
              tarea.adjuntos = {
                archivos: adjuntos.archivos || [],
                enlaces: adjuntos.enlaces || []
              };
            }
            
            // Asegurar que etiquetas sea un array
            if (!Array.isArray(tarea.etiquetas)) {
              tarea.etiquetas = [];
            }
            
            // Asegurar que checklists sea un array
            if (!Array.isArray(tarea.checklists)) {
              tarea.checklists = [];
            }
            
            // Asegurar que haya un contador de comentarios
            if (tarea.comentarios_count === undefined) {
              tarea.comentarios_count = tarea.comentarios?.length || 0;
            }
            
            console.log(`✅ Tarea procesada: ${tarea.name}`, {
              etiquetas: tarea.etiquetas.length,
              adjuntos: tarea.adjuntos.archivos.length + tarea.adjuntos.enlaces.length,
              checklists: tarea.checklists.length,
              comentarios: tarea.comentarios_count
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

  /**
   * Verifica si la tarea tiene indicadores para mostrar
   */
  tieneIndicadores(tarea: any): boolean {
    return (
      this.getTotalAdjuntos(tarea) > 0 ||
      this.getTotalChecklistItems(tarea) > 0 ||
      this.getTotalComentarios(tarea) > 0 ||
      !!tarea.user
    );
  }

  /**
   * Obtiene el total de adjuntos (archivos + enlaces)
   */
  getTotalAdjuntos(tarea: any): number {
    if (!tarea.adjuntos) return 0;
    
    const archivos = tarea.adjuntos.archivos?.length || 0;
    const enlaces = tarea.adjuntos.enlaces?.length || 0;
    
    return archivos + enlaces;
  }

  /**
   * Obtiene el total de items en todos los checklists
   */
  getTotalChecklistItems(tarea: any): number {
    if (!tarea.checklists || !Array.isArray(tarea.checklists)) return 0;
    
    return tarea.checklists.reduce((total: number, checklist: any) => {
      return total + (checklist.items?.length || 0);
    }, 0);
  }

  /**
   * Obtiene el total de items completados en los checklists
   */
  getCompletedChecklistItems(tarea: any): number {
    if (!tarea.checklists || !Array.isArray(tarea.checklists)) return 0;
    
    return tarea.checklists.reduce((total: number, checklist: any) => {
      if (!checklist.items) return total;
      
      const completados = checklist.items.filter((item: any) => item.completed).length;
      return total + completados;
    }, 0);
  }

  /**
   * Calcula el progreso total del checklist en porcentaje
   */
  getChecklistProgress(tarea: any): number {
    const total = this.getTotalChecklistItems(tarea);
    if (total === 0) return 0;
    
    const completados = this.getCompletedChecklistItems(tarea);
    return Math.round((completados / total) * 100);
  }

  /**
   * Verifica si todos los items del checklist están completados
   */
  isChecklistCompleted(tarea: any): boolean {
    const total = this.getTotalChecklistItems(tarea);
    if (total === 0) return false;
    
    return this.getCompletedChecklistItems(tarea) === total;
  }

  /**
   * Obtiene el total de comentarios
   */
  getTotalComentarios(tarea: any): number {
    // Si la tarea tiene comentarios cargados directamente
    if (tarea.comentarios && Array.isArray(tarea.comentarios)) {
      return tarea.comentarios.length;
    }
    
    // Si tiene un contador de comentarios
    if (tarea.comentarios_count !== undefined) {
      return tarea.comentarios_count;
    }
    
    return 0;
  }

  /**
   * Maneja errores de carga de avatar
   */
  onAvatarError(event: any): void {
    event.target.src = 'assets/media/avatars/blank.png';
  }
}