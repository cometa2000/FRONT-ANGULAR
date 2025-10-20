import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../service/documento.service';
import { CreateDocumentoComponent } from '../create-documento/create-documento.component';
import { EditDocumentoComponent } from '../edit-documento/edit-documento.component';
import { DeleteDocumentoComponent } from '../delete-documento/delete-documento.component';

@Component({
  selector: 'app-list-documento',
  templateUrl: './list-documento.component.html',
  styleUrls: ['./list-documento.component.scss']
})
export class ListDocumentoComponent {
  search:string = '';
  DOCUMENTOS:any = [];
  isLoading$:any;

  sucursalesConDocs: any[] = [];
  pageSize: number = 8; // cantidad de sucursales por página
  paginatedSucursales: any[] = [];

  sucursales:any = [];

  totalPages:number = 0;
  currentPage:number = 1;
  constructor(
    public modalService: NgbModal,
    public documentoService: DocumentoService,
  ) {
    
  }

  private actualizarPaginacion() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedSucursales = this.sucursalesConDocs.slice(start, end);
  }

  loadPage(page: number) {
    this.currentPage = page;
    this.actualizarPaginacion();
  }



  private calcularDocumentosPorSucursal() {
    this.sucursalesConDocs = this.sucursales.map((suc: any) => {
      const totalDocs = this.DOCUMENTOS.filter((doc: any) => doc.sucursale_id === suc.id).length;
      return {
        ...suc,
        totalDocs
      };
    });

    this.actualizarPaginacion();
  }

  
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.isLoading$ = this.documentoService.isLoading$;
    this.listDocumentos();
    this.configAll();
  }

  listDocumentos(page = 1){
    this.documentoService.listDocumentos(page,this.search).subscribe((resp:any) => {
      console.log(resp);
      this.DOCUMENTOS = resp.documentos;
      this.totalPages = resp.total;
      this.currentPage = page;

      this.calcularDocumentosPorSucursal();
    })
  }

  configAll(){
    this.documentoService.configAll().subscribe((resp:any) => {
      console.log(resp);
      this.sucursales = resp.sucursales;

      this.calcularDocumentosPorSucursal();
    })
  }

  // loadPage($event:any){
  //   this.listDocumentos($event);
  // }

  createDocumento(){
    const modalRef = this.modalService.open(CreateDocumentoComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.sucursales = this.sucursales;

    modalRef.componentInstance.DocumentoC.subscribe((documento:any) => {
      this.DOCUMENTOS.unshift(documento);
    })
  }

  editDocumento(DOCUMENTO:any){
    const modalRef = this.modalService.open(EditDocumentoComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
    modalRef.componentInstance.sucursales = this.sucursales;

    modalRef.componentInstance.DocumentoE.subscribe((documento:any) => {
      let INDEX = this.DOCUMENTOS.findIndex((documents:any) => documents.id == DOCUMENTO.id);
      if(INDEX != -1){
        this.DOCUMENTOS[INDEX] = documento;
      }
    })
  }

  deleteDocumento(DOCUMENTO:any){
    const modalRef = this.modalService.open(DeleteDocumentoComponent,{centered:true, size: 'md'});
    modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;

    modalRef.componentInstance.DocumentoD.subscribe((documento:any) => {
      let INDEX = this.DOCUMENTOS.findIndex((documents:any) => documents.id == DOCUMENTO.id);
      if(INDEX != -1){
        this.DOCUMENTOS.splice(INDEX,1);
      }
      // this.ROLES.unshift(role);
    })
  }
}
