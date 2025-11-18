import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { MethodPaymentService } from '../service/method-payment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-method-payment',
  templateUrl: './edit-method-payment.component.html',
  styleUrls: ['./edit-method-payment.component.scss']
})
export class EditMethodPaymentComponent {

  @Output() MethodPaymentE: EventEmitter<any> = new EventEmitter();
  @Input() METHOD_PAYMENTS:any = [];
  @Input() METHOD_PAYMENT_SELECTED:any;
  
  name:string = '';
  method_payment_id:string = '';
  state:number = 1;

  isLoading:any;

  constructor(
    public modal: NgbActiveModal,
    public methodPaymentService: MethodPaymentService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.METHOD_PAYMENT_SELECTED.name;
    this.method_payment_id = this.METHOD_PAYMENT_SELECTED.method_payment_id;
    this.state = this.METHOD_PAYMENT_SELECTED.state;
  }

  store() {
    if (!this.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del método de pago es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return false;
    }

    let data = {
      name: this.name,
      method_payment_id: this.method_payment_id,
      state: this.state,
    };

    this.methodPaymentService.updateMethodPayment(this.METHOD_PAYMENT_SELECTED.id, data)
      .subscribe({
        next: (resp: any) => {
          console.log(resp);

          if (resp.message == 403) {
            Swal.fire({
              icon: 'error',
              title: 'Validación',
              text: resp.message_text,
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Método de pago editado',
              text: 'El método de pago se editó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.MethodPaymentE.emit(resp.method_payment);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo editar el método de pago',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
