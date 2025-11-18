import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { MethodPaymentService } from '../service/method-payment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-method-payment',
  templateUrl: './create-method-payment.component.html',
  styleUrls: ['./create-method-payment.component.scss']
})
export class CreateMethodPaymentComponent {

  @Output() MethodPaymentC: EventEmitter<any> = new EventEmitter();
  @Input() METHOD_PAYMENTS:any = [];
  name:string = '';
  method_payment_id:string = '';

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
    };

    this.methodPaymentService.registerMethodPayment(data)
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
              title: 'Método de pago creado',
              text: 'El método de pago se registró correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.MethodPaymentC.emit(resp.method_payment);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo registrar el método de pago',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
