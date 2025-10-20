import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../service/documento.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-documento',
  templateUrl: './edit-documento.component.html',
  styleUrls: ['./edit-documento.component.scss']
})
export class EditDocumentoComponent {
  @Output() DocumentoE: EventEmitter<any> = new EventEmitter();
  @Input() DOCUMENTO_SELECTED:any;
  
  name:string = '';
  type:string = '';
  // state:number = 1;

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public codumentoService: DocumentoService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    // Add 'implements OnInit' to the class.
    this.name = this.DOCUMENTO_SELECTED.name;
    this.type = this.DOCUMENTO_SELECTED.type;
    // this.state = this.DOCUMENTO_SELECTED.state;
  }

  store(){
    if(!this.name){
      this.toast.error("Validación","El nombre del Documento es requerido");
      return false;
    }

    let data = {
      name: this.name,
      // type:this.type,
      // state: this.state,
    }

    this.codumentoService.updateDocumento(this.DOCUMENTO_SELECTED.id,data).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La documento se edito correctamente");
        this.DocumentoE.emit(resp.documento);
        this.modal.close();
      }
    })
  }
}
