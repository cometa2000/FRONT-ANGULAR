import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { MethodPaymentService } from '../service/method-payment.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-method-payment',
  templateUrl: './delete-method-payment.component.html',
  styleUrls: ['./delete-method-payment.component.scss']
})
export class DeleteMethodPaymentComponent {

  @Output() MethodPaymentD: EventEmitter<any> = new EventEmitter();
  @Input()  METHOD_PAYMENT_SELECTED:any;

  isLoading:any;
  constructor(
    public modal: NgbActiveModal,
    public method_paymentService: MethodPaymentService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
  }

  delete() {

    this.method_paymentService.deleteMethodPayment(this.METHOD_PAYMENT_SELECTED.id)
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
              title: 'Método de pago eliminado',
              text: 'El método de pago se eliminó correctamente',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });

            this.MethodPaymentD.emit(resp.message);
            this.modal.close();
          }
        },

        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el método de pago',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });
  }


}
