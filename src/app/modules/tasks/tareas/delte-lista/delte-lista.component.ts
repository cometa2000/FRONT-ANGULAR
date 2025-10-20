import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-delte-lista',
  templateUrl: './delte-lista.component.html',
  styleUrls: ['./delte-lista.component.scss']
})
export class DelteListaComponent {
  @Output() ListaD: EventEmitter<any> = new EventEmitter();
  @Input()  LISTA_SELECTED:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public tareasService: TareaService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete(){
    
    this.tareasService.deleteLista(this.LISTA_SELECTED.id).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La lista se elimino correctamente");
        this.ListaD.emit(resp.message);
        this.modal.close();
      }
    })
  }
}
