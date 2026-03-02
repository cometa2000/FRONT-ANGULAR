import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService } from '../service/tickets.service';

@Component({
  selector: 'app-delete-tickets',
  templateUrl: './delete-tickets.component.html',
  styleUrls: ['./delete-tickets.component.scss'],
})
export class DeleteTicketsComponent {

  @Output() TicketEliminado: EventEmitter<any> = new EventEmitter();
  @Input() TICKET_SELECTED: any;

  constructor(
    public modal: NgbActiveModal,
    public ticketsService: TicketsService,
  ) {}

  delete(): void {
    this.modal.close();

    this.ticketsService.deleteTicket(this.TICKET_SELECTED.id).subscribe({
      next: (resp: any) => {
        this.TicketEliminado.emit(resp.message);
      },
      error: (err: any) => {
        console.error('Error al eliminar ticket:', err);
      },
    });
  }
}