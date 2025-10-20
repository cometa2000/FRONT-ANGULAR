import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../service/vista-documento.service';
import { ActivatedRoute } from '@angular/router';
import { DeleteDocumentoComponent } from '../../documentos/delete-documento/delete-documento.component';
import { ViewVistaDocumentoComponent } from '../view-vista-documento/view-vista-documento.component';

@Component({
  selector: 'app-list-vista-documento',
  templateUrl: './list-vista-documento.component.html', 
  styleUrls: ['./list-vista-documento.component.scss']
}) 

export class ListVistaDocumentoComponent {
  search: string = ''; 
  DOCUMENTOS: any[] = []; 
  isLoading$: any; 

  sucursalId!: number; 
  currentPage: number = 1; 
  
  constructor(
    public modalService: NgbModal, 
    public viewDocumentoService: 
    VistaDocumentoService, 
    private route: ActivatedRoute,
  ){ 

  } 
    
    ngOnInit(): void { 
      this.isLoading$ = this.viewDocumentoService.isLoading$; // 👇 aquí tomamos el ID de la sucursal de la URL 
      this.route.paramMap.subscribe(params => { 
        this.sucursalId = Number(params.get('sucursalId')); 
        this.listDocumentos(); 
      }); 
    } 
    
    listDocumentos(page = 1) { 
      this.viewDocumentoService.listViewDocumentos(page, this.search).subscribe((resp: any) => { 
        // 👇 Filtramos por sucursal 
        this.DOCUMENTOS = resp.documentos.filter( 
          (doc: any) => doc.sucursale_id === this.sucursalId 
        ); 
        this.currentPage = page; 
      }); 
    } 

    viewDocumento(DOCUMENTO: any) {
      const modalRef = this.modalService.open(ViewVistaDocumentoComponent, { centered: true, size: 'xl' });
      modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO;
    }
    
    deleteDocumento(DOCUMENTO: any) { 
      const modalRef = this.modalService.open(DeleteDocumentoComponent, { centered: true, size: 'md' }); 
      modalRef.componentInstance.DOCUMENTO_SELECTED = DOCUMENTO; 

      modalRef.componentInstance.DocumentoD.subscribe((documento: any) => { 
        let INDEX = this.DOCUMENTOS.findIndex((d: any) => d.id == DOCUMENTO.id); 
        if (INDEX != -1) { 
          this.DOCUMENTOS.splice(INDEX, 1); 
        } 
      }); 
    } 
  }