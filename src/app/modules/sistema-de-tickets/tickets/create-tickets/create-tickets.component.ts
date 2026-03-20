import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService, Ticket, TicketConfig } from '../service/tickets.service';
import { ModalAdjuntosTicketsComponent, AdjuntoTicket } from '../modal-adjuntos-tickets/modal-adjuntos-tickets.component';
import { VistaDocumentoService } from 'src/app/modules/documents/vista-documentos/service/vista-documento.service';
import { ModalTareasTicketsComponent } from '../modal-tareas-tickets/modal-tareas-tickets.component';
import { TareaDisponible } from '../service/tickets.service';

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
  /** Adjuntos unificados: nuevo, existente en sistema o URL */
  adjuntos: AdjuntoTicket[] = [];

  prioridades = [
    { value: 'alta',  label: 'Alta',  class: 'danger'  },
    { value: 'media', label: 'Media', class: 'warning' },
    { value: 'baja',  label: 'Baja',  class: 'success' },
  ];

  categorias = [
    'Administrativo', 'Académico', 'Financiero / Contabilidad',
    'Mercadotecnia', 'Soporte técnico', 'Recursos Humanos', 'Legal', 'Otro',
  ];

  tareasAdjuntas: TareaDisponible[] = [];

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private fb: FormBuilder,
    public ticketsService: TicketsService,
    private vistaDocService: VistaDocumentoService,
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

  // ================================================================
  // MODAL DE ADJUNTOS
  // ================================================================

  abrirModalAdjuntos(): void {
    const ref = this.modalService.open(ModalAdjuntosTicketsComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });
    // En ticket nuevo no hay sucursal aún → el explorador muestra todo
    ref.componentInstance.sucursaleId = null;

    ref.componentInstance.AdjuntosSeleccionados.subscribe((adjuntos: AdjuntoTicket[]) => {
      this.adjuntos = [...this.adjuntos, ...adjuntos];
    });
  }

  removeAdjunto(index: number): void {
    this.adjuntos.splice(index, 1);
  }

  getNombreAdjunto(adj: AdjuntoTicket): string {
    if (adj.tipo === 'nuevo')     return adj.file.name;
    if (adj.tipo === 'existente') return adj.nombre;
    return adj.titulo;
  }

  getIconoAdjunto(adj: AdjuntoTicket): string {
    if (adj.tipo === 'url')       return 'ki-duotone ki-link';
    if (adj.tipo === 'existente') return 'ki-duotone ki-folder-open';
    return 'ki-duotone ki-file';
  }

  getColorAdjunto(adj: AdjuntoTicket): string {
    if (adj.tipo === 'url')       return 'badge-light-warning';
    if (adj.tipo === 'existente') return 'badge-light-info';
    return 'badge-light-primary';
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
    // TIPO 1: archivos nuevos
    (this.adjuntos.filter(a => a.tipo === 'nuevo') as any[])
      .forEach((a: any) => fd.append('adjuntos[]', a.file));

    // TIPO 2: documentos existentes (referencia, sin clonar)
    (this.adjuntos.filter(a => a.tipo === 'existente') as any[])
      .forEach((a: any) => fd.append('documento_ids[]', String(a.documento_id)));

    // TIPO 3: URLs externas
    const urls = this.adjuntos.filter(a => a.tipo === 'url') as any[];
    if (urls.length > 0) {
      fd.append('adjuntos_url', JSON.stringify(
        urls.map((u: any) => ({ titulo: u.titulo, url: u.url }))
      ));
    }

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

  abrirModalTareas(): void {
    const ref = this.modalService.open(ModalTareasTicketsComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    ref.componentInstance.TareasSeleccionadas.subscribe((tareas: TareaDisponible[]) => {
      // Evitar duplicados
      tareas.forEach((t) => {
        if (!this.tareasAdjuntas.find((existing) => existing.id === t.id)) {
          this.tareasAdjuntas.push(t);
        }
      });
    });
  }

  removeTareaAdjunta(index: number): void {
    this.tareasAdjuntas.splice(index, 1);
  }
}