import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TareaService } from '../service/tarea.service';

@Component({
  selector: 'app-delete-tarea',
  templateUrl: './delete-tarea.component.html',
  styleUrls: ['./delete-tarea.component.scss']
})
export class DeleteTareaComponent {
  @Output() TareaD: EventEmitter<any> = new EventEmitter();
  @Input()  TAREA_SELECTED:any;

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
    
    this.tareasService.deleteTarea(this.TAREA_SELECTED.id).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La tarea se elimino correctamente");
        this.TareaD.emit(resp.message);
        this.modal.close();
      }
    })
  }
}
