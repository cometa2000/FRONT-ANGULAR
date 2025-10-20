import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TareaService } from '../service/tarea.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-lista',
  templateUrl: './edit-lista.component.html',
  styleUrls: ['./edit-lista.component.scss']
})
export class EditListaComponent {
  @Output() ListaE: EventEmitter<any> = new EventEmitter();
  @Input() LISTA_SELECTED:any;
  @Input() users:any = [];
  @Input() TAREAS:any = [];
  @Input() sucursales:any = [];

  
  name:string = '';
  
  

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public tareaService: TareaService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.LISTA_SELECTED.name;
   
  }

  store(){
    if(!this.name){
      this.toast.error("Validación","El nombre de la tarea es requerido");
      return false;
    }

    let data = {
      name: this.name,
      
    }

    this.tareaService.updateLista(this.LISTA_SELECTED.id,data).subscribe((resp:any) => {
      console.log(resp);
      if(resp.message == 403){
        this.toast.error("Validación",resp.message_text);
      }else{
        this.toast.success("Exito","La lista se edito correctamente");
        this.ListaE.emit(resp.tarea);
        this.modal.close();
      }
    })
  }
}
