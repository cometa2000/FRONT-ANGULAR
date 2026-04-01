import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  TicketsService, TicketConfig,
  DestinoArea, DestinoSucursal, DestinoUsuario,
} from '../service/tickets.service';
import { ModalAdjuntosTicketsComponent, AdjuntoTicket } from '../modal-adjuntos-tickets/modal-adjuntos-tickets.component';
import { VistaDocumentoService } from 'src/app/modules/documents/vista-documentos/service/vista-documento.service';
import { ModalTareasTicketsComponent } from '../modal-tareas-tickets/modal-tareas-tickets.component';
import { TareaDisponible } from '../service/tickets.service';

/**
 * Opción normalizada para el <select> de destinatario.
 * Unifica áreas, sucursales y usuarios en una sola lista.
 */
export interface DestinoOption {
  value: string;           // formato: "area:1" | "sucursal:7" | "usuario:4"
  label: string;           // texto visible en el <option>
  tipo: 'area' | 'sucursal' | 'usuario_sucursal';
  id: number;
  // extras para reconstituir los datos al hacer submit
  responsable_id?: number;
  responsable_nombre?: string;
  responsable_avatar?: string;
  avatar?: string;
  rol?: string;
}

@Component({
  selector: 'app-create-tickets',
  templateUrl: './create-tickets.component.html',
  styleUrls: ['./create-tickets.component.scss'],
})
export class CreateTicketsComponent implements OnInit {

  @Output() TicketCreado: EventEmitter<any> = new EventEmitter();

  form: FormGroup;
  config: TicketConfig | null = null;
  isLoadingConfig = true;
  errorConfig: string | null = null;

  adjuntos: AdjuntoTicket[]       = [];
  tareasAdjuntas: TareaDisponible[] = [];

  /** Lista plana de opciones para el <select> */
  destinoOptions: DestinoOption[] = [];

  /** Opción actualmente seleccionada (para mostrar info extra debajo del select) */
  destinoSeleccionado: DestinoOption | null = null;

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
    private modalService: NgbModal,
    private fb: FormBuilder,
    public ticketsService: TicketsService,
    private vistaDocService: VistaDocumentoService,
  ) {
    this.form = this.fb.group({
      destino_value: [null, Validators.required],  // "tipo:id"
      asunto:        ['', [Validators.required, Validators.maxLength(255)]],
      descripcion:   ['', Validators.required],
      prioridad:     ['media', Validators.required],
      fecha_limite:  [null],
      categoria:     [null],
    });
  }

  ngOnInit(): void {
    this.cargarConfig();
  }

  // ================================================================
  // CARGA DE CONFIGURACIÓN
  // ================================================================

  cargarConfig(): void {
    this.isLoadingConfig = true;
    this.errorConfig     = null;

    this.ticketsService.getConfig().subscribe({
      next: (config: TicketConfig) => {
        this.config = config;
        this.buildDestinoOptions(config);
        this.isLoadingConfig = false;

        // Si equipo_sucursal y hay un solo franquiciatario → preseleccionar
        if (config.tipo_usuario === 'equipo_sucursal' && this.destinoOptions.length === 1) {
          this.form.patchValue({ destino_value: this.destinoOptions[0].value });
          this.destinoSeleccionado = this.destinoOptions[0];
        }
      },
      error: (err: any) => {
        this.isLoadingConfig = false;
        this.errorConfig = err?.userMessage || 'No se pudo cargar la configuración.';
      },
    });
  }

  /**
   * Construye la lista plana de opciones del <select> a partir del config.
   *
   * SEDE (sucursale_id = 5):
   *   optgroup "Áreas de la Sede"   → ticket_areas activas
   *   optgroup "Sucursales"         → sucursales (≠ sede)
   *
   * FRANQUICIATARIO (role_id = 30):
   *   optgroup "Áreas de la Sede"   → ticket_areas activas
   *   optgroup "Mi Equipo"          → usuarios de su sucursal (rol != 30)
   *
   * EQUIPO SUCURSAL (role_id ≠ 30, sucursale_id ≠ 5):
   *   sin optgroup                  → solo su franquiciatario
   */
  buildDestinoOptions(config: TicketConfig): void {
    this.destinoOptions = [];

    // ── Áreas de la sede (sede o franquiciatario) ──────────────────
    if (config.destinos_areas?.length) {
      config.destinos_areas.forEach((a: DestinoArea) => {
        this.destinoOptions.push({
          value:               `area:${a.id}`,
          label:               a.name,
          tipo:                'area',
          id:                  a.id,
          responsable_id:      a.responsable_id,
          responsable_nombre:  a.responsable_nombre,
          responsable_avatar:  a.responsable_avatar,
        });
      });
    }

    // ── Sucursales (solo sede) ─────────────────────────────────────
    if (config.destinos_sucursales?.length) {
      config.destinos_sucursales.forEach((s: DestinoSucursal) => {
        this.destinoOptions.push({
          value: `sucursal:${s.id}`,
          label: s.name,
          tipo:  'sucursal',
          id:    s.id,
        });
      });
    }

    // ── Equipo del franquiciatario ─────────────────────────────────
    if (config.destinos_equipo?.length) {
      config.destinos_equipo.forEach((u: DestinoUsuario) => {
        this.destinoOptions.push({
          value:  `usuario:${u.id}`,
          label:  u.name,
          tipo:   'usuario_sucursal',
          id:     u.id,
          avatar: (u as any).avatar,
          rol:    u.rol,
        });
      });
    }

    // ── Solo el franquiciatario (equipo sucursal) ──────────────────
    if (config.destinos?.length) {
      config.destinos.forEach((u: DestinoUsuario) => {
        this.destinoOptions.push({
          value:  `usuario:${u.id}`,
          label:  u.name,
          tipo:   'usuario_sucursal',
          id:     u.id,
          avatar: (u as any).avatar,
          rol:    u.rol,
        });
      });
    }
  }

  /** Devuelve las opciones filtradas por tipo (para usar con *ngFor en optgroup) */
  getOpcionesPorTipo(tipo: 'area' | 'sucursal' | 'usuario_sucursal'): DestinoOption[] {
    return this.destinoOptions.filter(o => o.tipo === tipo);
  }

  /** ¿Tiene opciones de áreas? */
  get tieneAreas(): boolean {
    return this.destinoOptions.some(o => o.tipo === 'area');
  }

  /** ¿Tiene opciones de sucursales? */
  get tieneSucursales(): boolean {
    return this.destinoOptions.some(o => o.tipo === 'sucursal');
  }

  /** ¿Tiene opciones de usuarios directos? */
  get tieneUsuarios(): boolean {
    return this.destinoOptions.some(o => o.tipo === 'usuario_sucursal');
  }

  // ================================================================
  // MANEJO DEL SELECT
  // ================================================================

  onDestinoChange(value: string | null): void {
    if (!value) {
      this.destinoSeleccionado = null;
      return;
    }
    this.destinoSeleccionado = this.destinoOptions.find(o => o.value === value) ?? null;
  }

  get esSede(): boolean {
    return this.config?.es_sede ?? false;
  }

  // ================================================================
  // ADJUNTOS
  // ================================================================

  abrirModalAdjuntos(): void {
    const ref = this.modalService.open(ModalAdjuntosTicketsComponent, {
      centered: true, size: 'lg', backdrop: 'static',
    });
    ref.componentInstance.sucursaleId = null;
    ref.componentInstance.AdjuntosSeleccionados.subscribe((adj: AdjuntoTicket[]) => {
      this.adjuntos = [...this.adjuntos, ...adj];
    });
  }

  removeAdjunto(i: number): void { this.adjuntos.splice(i, 1); }

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

  // ================================================================
  // TAREAS
  // ================================================================

  abrirModalTareas(): void {
    const ref = this.modalService.open(ModalTareasTicketsComponent, {
      centered: true, size: 'lg', backdrop: 'static',
    });
    ref.componentInstance.TareasSeleccionadas.subscribe((tareas: TareaDisponible[]) => {
      tareas.forEach(t => {
        if (!this.tareasAdjuntas.find(e => e.id === t.id)) this.tareasAdjuntas.push(t);
      });
    });
  }

  removeTareaAdjunta(i: number): void { this.tareasAdjuntas.splice(i, 1); }

  // ================================================================
  // SUBMIT
  // ================================================================

  store(): void {
    if (this.form.invalid || !this.config || !this.destinoSeleccionado) return;

    const val  = this.form.value;
    const dest = this.destinoSeleccionado;
    const fd   = new FormData();

    fd.append('asunto',       val.asunto);
    fd.append('descripcion',  val.descripcion);
    fd.append('tipo_destino', dest.tipo);  // 'area' | 'sucursal' | 'usuario_sucursal'

    // Prioridad/fecha/categoría solo la sede las gestiona
    if (this.config.es_sede) {
      if (val.prioridad)    fd.append('prioridad',    val.prioridad);
      if (val.fecha_limite) fd.append('fecha_limite', val.fecha_limite);
      if (val.categoria)    fd.append('categoria',    val.categoria);
    }

    // ID específico según tipo
    if (dest.tipo === 'area') {
      fd.append('ticket_area_id', String(dest.id));
    } else if (dest.tipo === 'sucursal') {
      fd.append('sucursal_destino_id', String(dest.id));
    } else if (dest.tipo === 'usuario_sucursal') {
      fd.append('asignado_id', String(dest.id));
    }

    // Adjuntos
    (this.adjuntos.filter(a => a.tipo === 'nuevo') as any[])
      .forEach((a: any) => fd.append('adjuntos[]', a.file));
    (this.adjuntos.filter(a => a.tipo === 'existente') as any[])
      .forEach((a: any) => fd.append('documento_ids[]', String(a.documento_id)));
    const urls = this.adjuntos.filter(a => a.tipo === 'url') as any[];
    if (urls.length) {
      fd.append('adjuntos_url', JSON.stringify(
        urls.map((u: any) => ({ titulo: u.titulo, url: u.url }))
      ));
    }

    // Tareas adjuntas
    this.tareasAdjuntas.forEach(t => fd.append('tarea_ids[]', String(t.id)));

    this.ticketsService.createTicket(fd).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.TicketCreado.emit(resp.ticket);
          this.modal.close();
        }
      },
      error: (err: any) => console.error('Error al crear ticket:', err),
    });
  }

  formatFileSize(b: number): string {
    return this.ticketsService.formatFileSize(b);
  }

  getAvatarUrl(avatar: string | null | undefined): string {
    if (!avatar) return 'assets/media/avatars/blank.png';
    if (avatar.startsWith('http')) return avatar;
    return `assets/media/avatars/${avatar}`;
  }
}