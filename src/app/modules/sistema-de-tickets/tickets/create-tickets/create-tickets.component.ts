import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService, Ticket, TicketConfig } from '../service/tickets.service';

@Component({
  selector: 'app-create-tickets',
  templateUrl: './create-tickets.component.html',
  styleUrls: ['./create-tickets.component.scss'],
})
export class CreateTicketsComponent implements OnInit {

  // Igual que sucursales: EventEmitter para comunicar al padre
  @Output() TicketCreado: EventEmitter<any> = new EventEmitter();

  form: FormGroup;
  config: TicketConfig | null = null;
  isLoadingConfig: boolean = true;
  errorConfig: string | null = null;
  adjuntos: File[] = [];

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
      destino_id:   [null, Validators.required],
      asunto:       ['', [Validators.required, Validators.maxLength(255)]],
      descripcion:  ['', Validators.required],
      prioridad:    ['media', Validators.required],
      fecha_limite: [null],
      categoria:    [null],
    });
  }

  ngOnInit(): void {
    this.cargarConfig();
  }

  cargarConfig(): void {
    this.isLoadingConfig = true;
    this.errorConfig = null;

    let headers = { 'Authorization': 'Bearer ' + this.ticketsService.authservice.token };
    this.ticketsService.getConfig().subscribe({
      next: (config: TicketConfig) => {
        this.config = config;
        this.isLoadingConfig = false;
      },
      error: (err: any) => {
        console.error('Error al cargar config:', err);
        this.isLoadingConfig = false;
        this.errorConfig = err?.userMessage || 'No se pudo cargar la configuración.';
      },
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.adjuntos = Array.from(input.files);
  }

  removeAdjunto(index: number): void {
    this.adjuntos.splice(index, 1);
  }

  store(): void {
    if (this.form.invalid || !this.config) return;

    const val = this.form.value;
    const fd = new FormData();
    fd.append('asunto',      val.asunto);
    fd.append('descripcion', val.descripcion);

    // Prioridad, categoría y fecha_limite: solo la sede los gestiona
    if (this.config.es_sede) {
      if (val.prioridad)    fd.append('prioridad',    val.prioridad);
      if (val.fecha_limite) fd.append('fecha_limite', val.fecha_limite);
      if (val.categoria)    fd.append('categoria',    val.categoria);
    }

    if (this.config.tipo_usuario === 'sede') {
      fd.append('sucursal_destino_id', String(val.destino_id));
    } else {
      fd.append('rol_destino_id', String(val.destino_id));
    }
    this.adjuntos.forEach((f) => fd.append('adjuntos[]', f));

    this.ticketsService.createTicket(fd).subscribe({
      next: (resp: any) => {
        if (resp.message == 200) {
          this.TicketCreado.emit(resp.ticket);
          this.modal.close();
        }
      },
      error: (err: any) => {
        console.error('Error al crear ticket:', err);
      },
    });
  }

  formatFileSize(bytes: number): string {
    return this.ticketsService.formatFileSize(bytes);
  }
}