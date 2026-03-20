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

// 🆕 Importar componentes de grupo
import { ShareGrupoComponent } from '../../grupos/share-grupo/share-grupo.component';
import { PermisosGrupoModalComponent } from '../../grupos/permisos-grupo-modal/permisos-grupo-modal.component';

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

  // 🆕 Control del menú de configuración del grupo
  grupoMenuOpen: boolean = false;

  // ✅ CAMBIO: Inicializar como false por seguridad hasta verificar permisos
  hasWriteAccess: boolean = false;
  isOwner: boolean = false;
  // ✅ NUEVO: Flag para saber si ya se cargaron los permisos
  permissionsLoaded: boolean = false;

  // 🆕 Variables para el modal de miembros
  selectedGrupo: any = null;
  miembrosGrupo: any[] = [];
  loadingMiembros: boolean = false;

  fromRoute: string = 'list-workspace';
  workspaceId?: number;

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

    this.route.queryParams.subscribe(queryParams => {
      this.fromRoute = queryParams['from'] || 'list-workspace';
      this.workspaceId = queryParams['workspaceId'] ? +queryParams['workspaceId'] : undefined;

      console.log('🔍 Tablero: Origen detectado:', this.fromRoute);
      if (this.workspaceId) {
        console.log('📌 Tablero: Workspace ID:', this.workspaceId);
      }
    });

    this.route.params.subscribe(params => {
      this.grupo_id = +params['grupo_id'];

      if (this.grupo_id) {
        this.checkWritePermissions(() => {
          this.loadGrupoData();
          this.listListas();
          this.configAll();
        });
      } else {
        this.toastr.warning('No se proporcionó un grupo válido', 'Advertencia');
        this.router.navigate(['/tasks/workspaces/list']);
      }
    });
  }

  checkWritePermissions(callback?: () => void) {
    if (this.grupo_id) {
      this.grupoService.checkWriteAccess(this.grupo_id).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.hasWriteAccess = resp.has_write_access;
            this.isOwner = resp.is_owner;
            this.permissionsLoaded = true;

            if (!this.hasWriteAccess && !this.isOwner) {
              console.log('👁️ Usuario tiene solo permisos de lectura');
              this.toastr.info('Tienes permisos de solo lectura en este grupo', 'Información', {
                timeOut: 4000
              });
            }

            this.cdr.detectChanges();

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
          if (callback) {
            callback();
          }
        }
      });
    }
  }

  loadGrupoData() {
    console.log('📋 Cargando información del grupo:', this.grupo_id);

    this.grupoService.getGrupo(this.grupo_id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del grupo:', resp);

        if (resp.message === 200 && resp.grupo) {
          this.GRUPO_SELECTED = resp.grupo;
          console.log('🎯 Grupo cargado:', this.GRUPO_SELECTED);
          this.cdr.detectChanges();
        } else {
          console.error('❌ Respuesta no exitosa:', resp);
          this.toastr.error('Error al cargar el grupo', 'Error');
          this.router.navigate(['/tasks/workspaces/list']);
        }
      },
      error: (err: any) => {
        console.error('❌ Error al cargar grupo:', err);
        this.toastr.error('El grupo no existe o no tienes acceso', 'Error');
        this.router.navigate(['/tasks/workspaces/list']);
      }
    });
  }

  toggleGrupoMenu(event: MouseEvent) {
    event.stopPropagation();
    this.grupoMenuOpen = !this.grupoMenuOpen;
  }

  closeGrupoMenuAnd(action: string) {
    this.grupoMenuOpen = false;

    switch (action) {
      case 'verMiembros':
        this.verMiembros();
        break;
      case 'shareGrupo':
        this.shareGrupo();
        break;
      case 'configPermisos':
        this.openPermissionsModal();
        break;
    }
  }

  verMiembros() {
    if (!this.GRUPO_SELECTED) {
      this.toastr.warning('No se ha cargado el grupo', 'Advertencia');
      return;
    }

    console.log('🔍 Ver miembros del grupo:', this.GRUPO_SELECTED.id);

    this.selectedGrupo = { ...this.GRUPO_SELECTED };
    this.miembrosGrupo = [];
    this.loadingMiembros = true;

    this.openMiembrosModal();

    this.grupoService.getSharedUsers(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de miembros:', resp);

        if (resp.message === 200) {
          this.miembrosGrupo = resp.shared_users || [];
          this.selectedGrupo.shared_with = resp.shared_users || [];
          console.log('👥 Miembros cargados:', this.miembrosGrupo);
        } else {
          console.warn('⚠️ Respuesta inesperada del servidor:', resp);
          this.toastr.warning('No se pudieron cargar los miembros', 'Advertencia');
        }

        this.loadingMiembros = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar miembros:', error);
        this.loadingMiembros = false;
        this.cdr.detectChanges();
        this.toastr.error('No se pudieron cargar los miembros del grupo', 'Error');
        this.closeMiembrosModal();
      }
    });
  }

  openMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');

    if (!modalElement) {
      console.error('❌ Modal element not found');
      return;
    }

    if (typeof (window as any).bootstrap !== 'undefined') {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
      console.log('✅ Modal abierto con Bootstrap 5');
    } else {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      document.body.classList.add('modal-open');

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'miembros-backdrop';
      document.body.appendChild(backdrop);

      console.log('✅ Modal abierto manualmente');
    }
  }

  closeMiembrosModal() {
    const modalElement = document.getElementById('miembrosModal');
    const backdrop = document.getElementById('miembros-backdrop');

    if (modalElement) {
      if (typeof (window as any).bootstrap !== 'undefined') {
        const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
      } else {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }

    if (backdrop) {
      backdrop.remove();
    }

    setTimeout(() => {
      this.selectedGrupo = null;
      this.miembrosGrupo = [];
      this.loadingMiembros = false;
    }, 300);

    console.log('✅ Modal cerrado');
  }

  shareGrupo() {
    if (!this.GRUPO_SELECTED) {
      this.toastr.warning('No se ha cargado el grupo', 'Advertencia');
      return;
    }

    if (!this.isOwner) {
      this.toastr.warning('Solo el propietario puede compartir el grupo', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(ShareGrupoComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.GRUPO_SELECTED = this.GRUPO_SELECTED;

    modalRef.componentInstance.GrupoShared.subscribe(() => {
      this.loadGrupoData();
      this.toastr.success('Grupo compartido correctamente', 'Éxito');
    });
  }

  openPermissionsModal() {
    if (!this.GRUPO_SELECTED) {
      this.toastr.warning('No se ha cargado el grupo', 'Advertencia');
      return;
    }

    if (!this.isOwner) {
      this.toastr.warning('Solo el propietario puede gestionar permisos', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(PermisosGrupoModalComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.GRUPO_SELECTED = this.GRUPO_SELECTED;

    modalRef.componentInstance.PermisosChanged.subscribe((grupoActualizado: any) => {
      this.GRUPO_SELECTED = { ...this.GRUPO_SELECTED, ...grupoActualizado };
      this.toastr.success('Permisos actualizados correctamente', 'Éxito');
      this.cdr.detectChanges();
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

    if (!target.closest('.menu-dropdown') && !target.closest('.btn-light-primary')) {
      this.grupoMenuOpen = false;
    }
  }

  toggleTaskExpand(tarea: any, event: MouseEvent) {
    event.stopPropagation();
    tarea.expanded = !tarea.expanded;
  }

  // ============================================================
  // onListDrop — actualización optimista sin flash
  // ============================================================
  onListDrop(event: CdkDragDrop<any[]>) {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para reordenar listas', 'Permiso denegado');
      return;
    }
    if (event.previousIndex === event.currentIndex) { return; }

    const previousOrder = [...this.LISTAS];

    moveItemInArray(this.LISTAS, event.previousIndex, event.currentIndex);

    const updatedListas = this.LISTAS.map((lista, index) => ({
      id: lista.id,
      orden: index
    }));

    this.tareaService.reorderListas(updatedListas).subscribe({
      next: () => {
        console.log('✅ Orden de listas guardado');
      },
      error: (error) => {
        console.error('❌ Error al guardar orden de listas:', error);
        this.LISTAS = previousOrder;
        this.cdr.detectChanges();
        this.toastr.error('No se pudo guardar el nuevo orden', 'Error');
      }
    });
  }

  getConnectedLists(): string[] {
    return this.LISTAS.map(lista => 'lista-' + lista.id);
  }

  // ============================================================
  // onTaskDrop — actualización optimista sin flash
  // ============================================================
  onTaskDrop(event: CdkDragDrop<any[]>, targetList: any) {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para mover tareas', 'Permiso denegado');
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(targetList.tareas, event.previousIndex, event.currentIndex);
    } else {
      const prevList = this.LISTAS.find(l => l.tareas === event.previousContainer.data);
      if (!prevList) return;

      const prevListSnapshot = [...prevList.tareas];
      const targetListSnapshot = [...targetList.tareas];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const movedTask = targetList.tareas[event.currentIndex];
      const newListId = targetList.id;

      movedTask.lista_id = newListId;
      movedTask.lista = { id: newListId, name: targetList.name };

      this.tareaService.moveTarea(movedTask.id, newListId).subscribe({
        next: () => {
          console.log('✅ Tarea movida correctamente');
        },
        error: (err) => {
          console.error('❌ Error al mover tarea:', err);
          prevList.tareas = prevListSnapshot;
          targetList.tareas = targetListSnapshot;
          movedTask.lista_id = prevList.id;
          movedTask.lista = { id: prevList.id, name: prevList.name };
          this.cdr.detectChanges();
          this.toastr.error('No se pudo mover la tarea', 'Error');
        }
      });
    }
  }

  createLista() {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para crear listas', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(CreateListaComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.grupo_id = this.grupo_id;

    modalRef.componentInstance.ListaC.subscribe((lista: any) => {
      this.LISTAS.push(lista);
      // ✅ Sin toastr: create-lista ya muestra su propio Swal de éxito
    });
  }

  editLista(lista: any) {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para editar listas', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(EditListaComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.LISTA_SELECTED = lista;

    modalRef.componentInstance.ListaE.subscribe((listaEditada: any) => {
      const index = this.LISTAS.findIndex((l: any) => l.id === lista.id);
      if (index !== -1) {
        // ✅ Fusionar: conservar .tareas y todo lo existente en memoria
        this.LISTAS[index] = {
          ...this.LISTAS[index],
          ...listaEditada
        };
        this.cdr.detectChanges();
      }
      // ✅ Sin toastr: edit-lista ya muestra su propio Swal de éxito
    });
  }

  deleteLista(lista: any) {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para eliminar listas', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(DelteListaComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.LISTA_SELECTED = lista;

    modalRef.componentInstance.ListaD.subscribe(() => {
      this.LISTAS = this.LISTAS.filter((l: any) => l.id !== lista.id);
      // ✅ Sin toastr: delte-lista ya muestra su propio Swal de éxito
    });
  }

  createTarea(lista_id: number) {
    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para crear tareas', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(CreateTareaComponent, {
      centered: true,
      size: 'xl'
    });

    modalRef.componentInstance.lista_id = lista_id;
    modalRef.componentInstance.grupo_id = this.grupo_id;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.sucursales = this.sucursales;

    modalRef.componentInstance.TareaC.subscribe((tarea: any) => {
      const lista = this.LISTAS.find((l: any) => l.id === lista_id);
      if (lista) {
        if (!lista.tareas) {
          lista.tareas = [];
        }
        lista.tareas.push(tarea);
      }
      // ✅ Sin toastr: create-tarea ya muestra su propio Swal de éxito
    });
  }

  editTarea(tarea: any) {
    const modalRef = this.modalService.open(EditTareaComponent, {
      centered: true,
      size: 'xl'
    });

    modalRef.componentInstance.TAREA_SELECTED = tarea;
    modalRef.componentInstance.users = this.users;
    modalRef.componentInstance.sucursales = this.sucursales;
    modalRef.componentInstance.grupo_id = this.grupo_id;
    modalRef.componentInstance.hasWriteAccess = this.hasWriteAccess;

    modalRef.componentInstance.TareaE.subscribe((tareaEditada: any) => {
      for (const lista of this.LISTAS) {
        const index = lista.tareas.findIndex((t: any) => t.id === tarea.id);
        if (index !== -1) {
          lista.tareas[index] = tareaEditada;
          break;
        }
      }
      // ✅ Sin toastr: edit-tarea ya muestra sus propios Swal de éxito por cada acción
    });
  }

  deleteTarea(tarea: any, event: MouseEvent) {
    event.stopPropagation();

    if (!this.hasWriteAccess) {
      this.toastr.warning('No tienes permisos para eliminar tareas', 'Permiso denegado');
      return;
    }

    const modalRef = this.modalService.open(DeleteTareaComponent, {
      centered: true,
      size: 'md'
    });

    modalRef.componentInstance.TAREA_SELECTED = tarea;

    modalRef.componentInstance.TareaD.subscribe(() => {
      for (const lista of this.LISTAS) {
        const index = lista.tareas.findIndex((t: any) => t.id === tarea.id);
        if (index !== -1) {
          lista.tareas.splice(index, 1);
          break;
        }
      }
      // ✅ Sin toastr: delete-tarea ya muestra su propio Swal de éxito
    });
  }

  listListas() {
    this.tareaService.listListas(this.grupo_id).subscribe({
      next: (resp: any) => {
        console.log('📋 Listas cargadas del servidor:', resp);

        if (resp.listas && resp.listas.length > 0) {
          const primeraTarea = resp.listas[0]?.tareas?.[0];
          console.log('🔍 DEBUG - Primera tarea para analizar estructura:', primeraTarea);

          console.log('📊 Estructura de la primera tarea:', {
            id: primeraTarea?.id,
            name: primeraTarea?.name,
            tiene_assigned_members: !!primeraTarea?.assigned_members,
            assigned_members: primeraTarea?.assigned_members,
            tipo_assigned_members: typeof primeraTarea?.assigned_members,
            es_array: Array.isArray(primeraTarea?.assigned_members),
            length: primeraTarea?.assigned_members?.length,
            primer_miembro: primeraTarea?.assigned_members?.[0],
            status: primeraTarea?.status,
            priority: primeraTarea?.priority,
            tiene_etiquetas: !!primeraTarea?.etiquetas,
            num_etiquetas: primeraTarea?.etiquetas?.length || 0,
            tiene_adjuntos: !!primeraTarea?.adjuntos,
            estructura_adjuntos: primeraTarea?.adjuntos,
            tiene_checklists: !!primeraTarea?.checklists,
            num_checklists: primeraTarea?.checklists?.length || 0,
            tiene_comentarios: primeraTarea?.comentarios !== undefined,
            num_comentarios: primeraTarea?.comentarios?.length || primeraTarea?.comentarios_count || 0,
            tiene_user: !!primeraTarea?.user,
            user_data: primeraTarea?.user
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

            if (!Array.isArray(tarea.assigned_members)) {
              tarea.assigned_members = [];
            }

            if (tarea.assigned_members.length > 0) {
              console.log(`🔍 DEBUG - Tarea: "${tarea.name}" tiene ${tarea.assigned_members.length} miembro(s)`);
              tarea.assigned_members.forEach((member: any, index: number) => {
                console.log(`   👤 Miembro ${index + 1}:`, {
                  id: member.id,
                  name: member.name,
                  surname: member.surname,
                  email: member.email,
                  avatar: member.avatar,
                  avatar_type: typeof member.avatar,
                  todas_las_propiedades: Object.keys(member)
                });
              });
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
    console.log('🔙 Volviendo desde:', this.fromRoute);

    if (this.fromRoute === 'list-grupo' && this.workspaceId) {
      console.log('➡️ Navegando a /tasks/grupos/' + this.workspaceId);
      this.router.navigate(['/tasks/grupos', this.workspaceId]);
    } else {
      console.log('➡️ Navegando a /tasks/workspaces/list');
      this.router.navigate(['/tasks/workspaces/list']);
    }
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
    const failedUrl = event.target.src;
    console.error('❌ Error al cargar avatar:', {
      url_fallida: failedUrl,
      elemento: event.target
    });
    console.log('   → Cambiando a 1.png');
    event.target.src = 'assets/media/avatars/1.png';
  }

  public getMemberAvatar(member: any): string {
    console.log('🎨 getMemberAvatar llamado con:', {
      member_completo: member,
      tiene_avatar: !!member?.avatar,
      valor_avatar: member?.avatar,
      tipo_avatar: typeof member?.avatar
    });

    if (member?.avatar) {
      const url = this.getAvatarUrl(member.avatar);
      console.log('   ✅ Avatar URL generada:', url);
      return url;
    }

    console.log('   ⚠️ Sin avatar, usando 1.png');
    return 'assets/media/avatars/1.png';
  }

  public getAvatarUrl(avatarValue: string): string {
    console.log('🔧 getAvatarUrl recibió:', {
      valor: avatarValue,
      tipo: typeof avatarValue,
      es_vacio: !avatarValue
    });

    if (!avatarValue) {
      console.log('   → Retornando 1.png (valor vacío)');
      return 'assets/media/avatars/1.png';
    }

    if (/^\d+$/.test(avatarValue)) {
      const url = `assets/media/avatars/${avatarValue}.png`;
      console.log('   → Caso: solo número. URL:', url);
      return url;
    }

    if (/^\d+\.png$/.test(avatarValue)) {
      const url = `assets/media/avatars/${avatarValue}`;
      console.log('   → Caso: número.png. URL:', url);
      return url;
    }

    if (avatarValue.includes('http') || avatarValue.includes('storage')) {
      console.log('   → Caso: URL completa. URL:', avatarValue);
      return avatarValue;
    }

    const url = `assets/media/avatars/${avatarValue}`;
    console.log('   → Caso: general. URL:', url);
    return url;
  }

  getUserAvatar(): string {
    const userToCheck = this.selectedGrupo?.user;

    if (userToCheck?.avatar) {
      return this.getAvatarUrl(userToCheck.avatar);
    }

    return 'assets/media/avatars/1.png';
  }

}