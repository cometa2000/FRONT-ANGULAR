import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { CreateTareaComponent } from '../create-tarea/create-tarea.component';
import { EditTareaComponent } from '../edit-tarea/edit-tarea.component';
import { DeleteTareaComponent } from '../delete-tarea/delete-tarea.component';
import { CreateListaComponent } from '../create-lista/create-lista.component';
import { EditListaComponent } from '../edit-lista/edit-lista.component';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DelteListaComponent } from '../delte-lista/delte-lista.component';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-list-tarea',
  templateUrl: './list-tarea.component.html',
  styleUrls: ['./list-tarea.component.scss']
})
export class ListTareaComponent {
  search: string = '';
  TAREAS: any = [];
  LISTAS: any[] = [];
  GRUPOS: any = [];
  isLoading$: any;
  sucursales: any = [];
  users: any = [];

  totalPages: number = 0;
  currentPage: number = 1;

  openMenuId: number | null = null;

  constructor(
    public modalService: NgbModal,
    public tareaService: TareaService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  // 👇 Menú desplegable (similar al de list-grupo)
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

  ngOnInit(): void {
    this.isLoading$ = this.tareaService.isLoading$;

    setTimeout(() => {
      this.listListas();
      this.listTareas();
      this.configAll();
    }, 300);
  }

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
      this.tareaService.moveTarea(movedTask.id, targetList.id).subscribe(() => {
        console.log('✅ Tarea actualizada en servidor');
      });
    }

    this.cdr.detectChanges();
  }

  createLista() {
    const modalRef = this.modalService.open(CreateListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.ListaC.subscribe((lista: any) => {
      this.LISTAS.push({ ...lista, tareas: [] });
      this.cdr.detectChanges();
    });
  }

  createTarea(listaId: number) {
    const modalRef = this.modalService.open(CreateTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.lista_id = listaId;
    modalRef.componentInstance.TareaC.subscribe((tarea: any) => {
      const targetList = this.LISTAS.find(l => l.id === listaId);
      if (targetList) {
        targetList.tareas.push(tarea);
      }
    });
  }

  editTarea(TAREA: any) {
    const modalRef = this.modalService.open(EditTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;
    modalRef.componentInstance.users = this.users;
  }

  editLista(LISTA: any) {
    const modalRef = this.modalService.open(EditListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;
  }

  deleteTarea(TAREA: any) {
    const modalRef = this.modalService.open(DeleteTareaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.TAREA_SELECTED = TAREA;
    modalRef.componentInstance.TareaD.subscribe((tarea: any) => {
      this.LISTAS.forEach(list => {
        list.tareas = list.tareas.filter((t: any) => t.id !== tarea.id);
      });
      this.cdr.detectChanges();
    });
  }

  deleteLista(LISTA: any) {
    const modalRef = this.modalService.open(DelteListaComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.LISTA_SELECTED = LISTA;
    modalRef.componentInstance.ListaD.subscribe((lista: any) => {
      this.LISTAS.forEach(list => {
        list.listas = list.listass.filter((l: any) => l.id !== lista.id);
      });
      this.cdr.detectChanges();
    });
  }

  listListas() {
    this.tareaService.listListas().subscribe((resp: any) => {
      console.log(resp);
      this.LISTAS = resp.listas;
      this.cdr.detectChanges();
    });
  }

  listTareas(page = 1) {
    this.tareaService.listTareas(page, this.search).subscribe((resp: any) => {
      console.log(resp);
      this.TAREAS = resp.tareas;
      this.totalPages = resp.total;
      this.currentPage = page;
      this.cdr.detectChanges();
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
      case 'editTarea':
        this.editTarea(data);
        break;
      case 'deleteTarea':
        this.deleteTarea(data);
        break;
      // puedes agregar más acciones si lo necesitas
    }
  }

}
