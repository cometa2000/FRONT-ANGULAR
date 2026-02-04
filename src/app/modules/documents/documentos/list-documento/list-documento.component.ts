import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../service/documento.service';
import { CreateDocumentoComponent } from '../create-documento/create-documento.component';

@Component({
  selector: 'app-list-documento',
  templateUrl: './list-documento.component.html',
  styleUrls: ['./list-documento.component.scss']
})
export class ListDocumentoComponent implements OnInit {
  search: string = '';
  DOCUMENTOS: any[] = [];
  isLoading$: any;

  sucursalesConDocs: any[] = [];
  pageSize: number = 9;
  paginatedSucursales: any[] = [];

  sucursales: any[] = [];
  currentUser: any = null;
  isAdmin: boolean = false;

  totalPages: number = 0;
  currentPage: number = 1;

  constructor(
    public modalService: NgbModal,
    public documentoService: DocumentoService,
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.documentoService.isLoading$;
    this.configAll();
  }

  /**
   * Obtener configuración inicial
   */
  configAll() {
    this.documentoService.configAll().subscribe((resp: any) => {
      console.log('Config response:', resp);
      
      this.sucursales = resp.sucursales || [];
      this.currentUser = resp.user;
      this.isAdmin = resp.user?.is_admin || resp.user?.role_id === 1;

      // Cargar documentos después de tener la configuración
      this.listDocumentos();
    });
  }

  /**
   * Listar todos los documentos
   */
  listDocumentos(page = 1) {
    this.documentoService.listDocumentos(page, this.search).subscribe((resp: any) => {
      console.log('Documentos response:', resp);
      
      this.DOCUMENTOS = resp.documentos || [];
      this.totalPages = resp.total || 0;
      this.currentPage = page;

      this.calcularDocumentosPorSucursal();
    });
  }

  /**
   * Calcular estadísticas de documentos por sucursal
   */
  private calcularDocumentosPorSucursal() {
    // Las estadísticas ya vienen del backend, solo filtramos según el rol
    this.sucursalesConDocs = [...this.sucursales];

    // Filtrar sucursales según el rol del usuario
    if (!this.isAdmin && this.currentUser) {
      this.sucursalesConDocs = this.sucursalesConDocs.filter(
        (suc: any) => suc.id === this.currentUser.sucursale_id
      );
    }

    this.actualizarPaginacion();
  }

  /**
   * Actualizar paginación
   */
  private actualizarPaginacion() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedSucursales = this.sucursalesConDocs.slice(start, end);
  }

  /**
   * Cargar página específica
   */
  loadPage(page: number) {
    this.currentPage = page;
    this.actualizarPaginacion();
  }

  /**
   * Abrir modal para crear documento(s)
   */
  createDocumento() {
    const modalRef = this.modalService.open(CreateDocumentoComponent, {
      centered: true, 
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.sucursales = this.sucursales;
    modalRef.componentInstance.currentUser = this.currentUser;
    modalRef.componentInstance.isAdmin = this.isAdmin;

    modalRef.componentInstance.DocumentosCreated.subscribe((documentos: any[]) => {
      // Agregar los nuevos documentos al listado
      if (Array.isArray(documentos)) {
        this.DOCUMENTOS.unshift(...documentos);
      } else {
        this.DOCUMENTOS.unshift(documentos);
      }
      
      // Recalcular estadísticas
      this.calcularDocumentosPorSucursal();
    });
  }
}