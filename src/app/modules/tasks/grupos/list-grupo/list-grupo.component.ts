import { Component, HostListener } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GrupoService } from '../service/grupo.service';
import { CreateGrupoComponent } from '../create-grupo/create-grupo.component';
import { EditGrupoComponent } from '../edit-grupo/edit-grupo.component';
import { DeleteGrupoComponent } from '../delete-grupo/delete-grupo.component';
import { ShareGrupoComponent } from '../share-grupo/share-grupo.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-list-grupo',
  templateUrl: './list-grupo.component.html',
  styleUrls: ['./list-grupo.component.scss']
})
export class ListGrupoComponent {
  search: string = '';
  GRUPOS: any = [];
  isLoading$: any;

  totalPages: number = 0;
  currentPage: number = 1;

  openMenuId: number | null = null;
  
  // ✅ NUEVO: Control de tooltip
  activeTooltip: number | null = null;
  showAllUsers: { [key: number]: boolean } = {};

  constructor(
    public modalService: NgbModal,
    public grupoService: GrupoService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.grupoService.isLoading$;
    this.listGrupos();
  }

  listGrupos(page = 1) {
    this.grupoService.listGrupos(page, this.search).subscribe((resp: any) => {
      console.log('Grupos cargados:', resp);
      this.GRUPOS = resp.grupos;
      this.totalPages = resp.total;
      this.currentPage = page;
    });
  }

  loadPage($event: any) {
    this.listGrupos($event);
  }

  createGrupo() {
    const modalRef = this.modalService.open(CreateGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GrupoC.subscribe((grupo: any) => {
      this.GRUPOS.unshift(grupo);
    });
  }

  editGrupo(grupo: any) {
    const modalRef = this.modalService.open(EditGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoE.subscribe((grupoEditado: any) => {
      const index = this.GRUPOS.findIndex((g: any) => g.id === grupo.id);
      if (index !== -1) this.GRUPOS[index] = grupoEditado;
    });
  }

  deleteGrupo(grupo: any) {
    const modalRef = this.modalService.open(DeleteGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoD.subscribe(() => {
      this.GRUPOS = this.GRUPOS.filter((g: any) => g.id !== grupo.id);
    });
  }

  shareGrupo(grupo: any) {
    const modalRef = this.modalService.open(ShareGrupoComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.GRUPO_SELECTED = grupo;
    modalRef.componentInstance.GrupoShared.subscribe(() => {
      this.listGrupos(this.currentPage);
    });
  }

  // ⭐ Marcar/Desmarcar grupo
  marcarGrupo(grupo: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    
    this.grupoService.toggleStar(grupo.id).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          grupo.is_starred = resp.is_starred;
          const message = grupo.is_starred ? 'Grupo marcado' : 'Marca removida';
          this.toast.success(message, 'Éxito');
          
          // Reordenar lista para mostrar primero los marcados
          this.GRUPOS.sort((a: any, b: any) => {
            if (a.is_starred === b.is_starred) return 0;
            return a.is_starred ? -1 : 1;
          });
        }
      },
      error: (error) => {
        console.error('Error al marcar grupo:', error);
        this.toast.error('No se pudo marcar el grupo', 'Error');
      }
    });
  }

  // ✅ NUEVO: Mostrar tooltip
  showTooltip(grupoId: number) {
    this.activeTooltip = grupoId;
  }

  // ✅ NUEVO: Ocultar tooltip
  hideTooltip(grupoId: number) {
    this.activeTooltip = null;
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

  closeMenuAnd(action: string, grupo: any) {
    this.openMenuId = null;
    
    switch(action) {
      case 'marcarGrupo':
        this.marcarGrupo(grupo);
        break;
      case 'shareGrupo':
        this.shareGrupo(grupo);
        break;
      case 'editGrupo':
        this.editGrupo(grupo);
        break;
      case 'deleteGrupo':
        this.deleteGrupo(grupo);
        break;
    }
  }
}