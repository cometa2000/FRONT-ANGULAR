import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../service/documento.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-delete-documento',
  templateUrl: './delete-documento.component.html',
  styleUrls: ['./delete-documento.component.scss']
})
export class DeleteDocumentoComponent {
    @Output() DocumentoD: EventEmitter<any> = new EventEmitter();
    @Input()  DOCUMENTO_SELECTED:any;
  
    isLoading:any;
    constructor(
      public modal: NgbActiveModal,
      public documentoService: DocumentoService,
      public toast: ToastrService,
    ) {
      
    }
  
    ngOnInit(): void {
    }
  
    delete(){
      
      this.documentoService.deleteDocumento(this.DOCUMENTO_SELECTED.id).subscribe((resp:any) => {
        console.log(resp);
        if(resp.message == 403){
          this.toast.error("Validación",resp.message_text);
        }else{
          this.toast.success("Exito","La sucursal se elimino correctamente");
          this.DocumentoD.emit(resp.message);
          this.modal.close();
        }
      })
    }
}
