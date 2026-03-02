import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService, Ticket } from '../service/tickets.service';

@Component({
  selector: 'app-edit-tickets',
  templateUrl: './edit-tickets.component.html',
  styleUrls: ['./edit-tickets.component.scss'],
})
export class EditTicketsComponent implements OnInit {

  @Output() TicketEditado: EventEmitter<any> = new EventEmitter();
  @Input() TICKET_SELECTED: any;

  form: FormGroup;
  isLoading: boolean = false;
  adjuntosNuevos: File[] = [];

  prioridades = [
    { value: 'alta',  label: 'Alta',  class: 'danger'  },
    { value: 'media', label: 'Media', class: 'warning' },
    { value: 'baja',  label: 'Baja',  class: 'success' },
  ];

  categorias = [
    'Administrativo', 'Académico', 'Financiero / Contabilidad',
    'Mercadotecnia', 'Soporte técnico', 'Recursos Humanos', 'Legal', 'Otro',
  ];

  constructor(
    public modal: NgbActiveModal,
    private fb: FormBuilder,
    public ticketsService: TicketsService,
  ) {
    this.form = this.fb.group({
      asunto:       ['', [Validators.required, Validators.maxLength(255)]],
      descripcion:  ['', Validators.required],
      prioridad:    ['media', Validators.required],
      fecha_limite: [null],
      categoria:    [null],
    });
  }

  ngOnInit(): void {
    this.form.patchValue({
      asunto:       this.TICKET_SELECTED.asunto,
      descripcion:  this.TICKET_SELECTED.descripcion,
      prioridad:    this.TICKET_SELECTED.prioridad,
      fecha_limite: this.TICKET_SELECTED.fecha_limite ?? null,
      categoria:    this.TICKET_SELECTED.categoria ?? null,
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.adjuntosNuevos = [...this.adjuntosNuevos, ...Array.from(input.files)];
  }

  removeAdjunto(index: number): void {
    this.adjuntosNuevos.splice(index, 1);
  }

  store(): void {
    if (this.form.invalid) return;
    this.isLoading = true;

    const val = this.form.value;
    const fd = new FormData();
    fd.append('asunto',      val.asunto);
    fd.append('descripcion', val.descripcion);
    fd.append('prioridad',   val.prioridad);
    if (val.fecha_limite) fd.append('fecha_limite', val.fecha_limite);
    if (val.categoria)    fd.append('categoria', val.categoria);
    this.adjuntosNuevos.forEach((f) => fd.append('adjuntos[]', f));

    this.ticketsService.updateTicket(this.TICKET_SELECTED.id, fd).subscribe({
      next: (resp: any) => {
        if (resp.message == 200) {
          this.TicketEditado.emit(resp.ticket);
          this.modal.close();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  formatFileSize(bytes: number): string {
    return this.ticketsService.formatFileSize(bytes);
  }
}