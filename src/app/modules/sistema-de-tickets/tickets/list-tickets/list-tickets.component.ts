import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { TicketsService, Ticket, TicketMetricas, TicketConfig } from '../service/tickets.service';
import { CreateTicketsComponent } from '../create-tickets/create-tickets.component';
import { EditTicketsComponent } from '../edit-tickets/edit-tickets.component';
import { DeleteTicketsComponent } from '../delete-tickets/delete-tickets.component';

@Component({
  selector: 'app-list-tickets',
  templateUrl: './list-tickets.component.html',
  styleUrls: ['./list-tickets.component.scss'],
})
export class ListTicketsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Estado principal ──
  tickets: Ticket[] = [];
  ticketSeleccionado: Ticket | null = null;
  metricas: TicketMetricas | null = null;
  /** config devuelve es_sede para controlar visibilidad del botón de estado */
  config: TicketConfig | null = null;
  isLoading$: any;

  // ── Vista activa — controlada por queryParam del sidebar ──
  vistaActiva: string = 'bandeja';
  vistaLabels: Record<string, string> = {
    bandeja:     'Bandeja de Entrada',
    enviados:    'Enviados',
    en_proceso:  'En Proceso',
    finalizados: 'Finalizados',
    archivados:  'Archivados',
    favoritos:   'Favoritos',
  };

  // ── Filtros ──
  filtroSearch: string = '';
  filtroPrioridad: string = '';

  // ── UI State ──
  isLoading: boolean = false;
  isLoadingDetalle: boolean = false;

  // ── Panel de cambio de estado ──
  showEstadoPanel: boolean = false;
  nuevoEstado: string = '';
  comentarioEstado: string = '';

  /** Lista completa — solo se muestra la que el usuario puede usar */
  private todosLosEstados = [
    { value: 'pendiente',  label: 'Pendiente',  class: 'warning' },
    { value: 'en_proceso', label: 'En Proceso', class: 'primary' },
    { value: 'en_espera',  label: 'En Espera',  class: 'info'    },
    { value: 'resuelto',   label: 'Resuelto',   class: 'success' },
    { value: 'cerrado',    label: 'Cerrado',     class: 'dark'    },
    { value: 'rechazado',  label: 'Rechazado',   class: 'danger'  },
  ];

  // ── Mensaje nuevo ──
  nuevoMensaje: string = '';
  adjuntosNuevoMensaje: File[] = [];
  isSendingMessage: boolean = false;

  constructor(
    public modalService: NgbModal,
    public ticketsService: TicketsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.isLoading$ = this.ticketsService.isLoading$;

    // Cargar config para determinar si el usuario es de la sede
    this.ticketsService.getConfig().subscribe({
      next: (cfg: any) => {
        this.ngZone.run(() => {
          this.config = cfg;
          this.cdr.detectChanges();
        });
      },
    });

    // Escuchar cambios del queryParam ?vista=xxx desde el sidebar
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const vista = params['vista'] || 'bandeja';
      if (vista !== this.vistaActiva) {
        this.vistaActiva = vista;
        this.filtroSearch = '';
        this.filtroPrioridad = '';
        this.ticketSeleccionado = null;
      }
      this.cargarTickets();
      this.cargarMetricas();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Label de la vista actual ──
  getVistaLabel(): string {
    return this.vistaLabels[this.vistaActiva] ?? this.vistaActiva;
  }

  // ================================================================
  // PERMISOS DE ESTADO
  // ================================================================

  /**
   * El botón de cambiar estado SOLO aparece si:
   * 1. El usuario es de la sede principal (huezo) → puede usar todos los estados
   * 2. El usuario es el franquiciatario asignado al ticket → puede usar todos
   * (Los demás usuarios solo pueden usar en_proceso y en_espera, pero ese control
   *  está en el backend; aquí simplemente mostramos el botón a quien le corresponde)
   */
  get puedeVerBotonEstado(): boolean {
    if (!this.ticketSeleccionado) return false;
    // Ticket cerrado o rechazado: nadie puede cambiar estado
    if (['cerrado', 'rechazado'].includes(this.ticketSeleccionado.estado)) return false;
    // Usuario de la sede: siempre puede
    if (this.config?.es_sede) return true;
    // Franquiciatario asignado: puede
    const userId = this.ticketsService.authservice.user?.id;
    return this.ticketSeleccionado.asignado?.id === userId;
  }

  /**
   * Los estados disponibles en el panel dependen del tipo de usuario:
   * - Sede o franquiciatario asignado → todos los estados
   * - Otros → solo en_proceso y en_espera (aunque el backend también lo valida)
   */
  get estadosDisponiblesParaUsuario() {
    const esSede = this.config?.es_sede;
    const userId = this.ticketsService.authservice.user?.id;
    const esFranqAsignado = this.ticketSeleccionado?.asignado?.id === userId;
    if (esSede || esFranqAsignado) return this.todosLosEstados;
    return this.todosLosEstados.filter(e => ['en_proceso', 'en_espera'].includes(e.value));
  }

  // ================================================================
  // CARGA DE DATOS
  // ================================================================
  cargarMetricas(): void {
    this.ticketsService.getMetricas().subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          this.metricas = resp.metricas;
          this.cdr.detectChanges();
        });
      },
      error: () => {},
    });
  }

  cargarTickets(): void {
    this.isLoading = true;
    this.tickets = [];
    this.ticketSeleccionado = null;
    this.cdr.detectChanges();

    this.ticketsService.getTickets({
      vista:     this.vistaActiva,
      search:    this.filtroSearch,
      prioridad: this.filtroPrioridad,
    }).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          this.tickets = Array.isArray(resp.tickets)
            ? resp.tickets
            : Object.values(resp.tickets);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  // ================================================================
  // SELECCIONAR TICKET
  // ================================================================
  seleccionarTicket(ticket: Ticket): void {
    this.isLoadingDetalle = true;
    this.showEstadoPanel = false;
    this.cdr.detectChanges();

    this.ticketsService.getTicket(ticket.id).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          this.ticketSeleccionado = resp.ticket;
          this.isLoadingDetalle = false;
          this.nuevoMensaje = '';
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoadingDetalle = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  cerrarDetalle(): void {
    this.ticketSeleccionado = null;
    this.cdr.detectChanges();
  }

  // ================================================================
  // CAMBIAR ESTADO
  // ================================================================
  abrirPanelEstado(): void {
    this.showEstadoPanel = true;
    this.nuevoEstado = this.ticketSeleccionado?.estado ?? '';
    this.comentarioEstado = '';
    this.cdr.detectChanges();
  }

  aplicarCambioEstado(): void {
    if (!this.ticketSeleccionado || !this.nuevoEstado) return;
    const ticketSnapshot = this.ticketSeleccionado;

    this.ticketsService.cambiarEstado(ticketSnapshot.id, this.nuevoEstado, this.comentarioEstado)
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.showEstadoPanel = false;
            this.cdr.detectChanges();
            this.seleccionarTicket(ticketSnapshot);
            this.cargarTickets();
            this.cargarMetricas();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.showEstadoPanel = false;
            this.cdr.detectChanges();
          });
        },
      });
  }

  // ================================================================
  // ENVIAR MENSAJE
  // ================================================================
  onAdjuntoMensaje(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.adjuntosNuevoMensaje = Array.from(input.files);
  }

  enviarMensaje(): void {
    if (!this.ticketSeleccionado || !this.nuevoMensaje.trim()) return;
    this.isSendingMessage = true;
    this.cdr.detectChanges();

    const fd = new FormData();
    fd.append('contenido', this.nuevoMensaje);
    this.adjuntosNuevoMensaje.forEach(f => fd.append('adjuntos[]', f));

    this.ticketsService.sendMessage(this.ticketSeleccionado.id, fd).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          if (!this.ticketSeleccionado!.messages) this.ticketSeleccionado!.messages = [];
          this.ticketSeleccionado!.messages.push(resp.mensaje);
          this.nuevoMensaje = '';
          this.adjuntosNuevoMensaje = [];
          this.isSendingMessage = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => { this.isSendingMessage = false; this.cdr.detectChanges(); });
      },
    });
  }

  // ================================================================
  // FAVORITO / ARCHIVAR
  // ================================================================
  toggleFavorito(ticket: Ticket, event: Event): void {
    event.stopPropagation();
    this.ticketsService.toggleFavorito(ticket.id).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          ticket.es_favorito = resp.es_favorito;
          if (this.ticketSeleccionado?.id === ticket.id) {
            this.ticketSeleccionado.es_favorito = resp.es_favorito;
          }
          this.cdr.detectChanges();
        });
      },
    });
  }

  archivar(ticket: Ticket, event: Event): void {
    event.stopPropagation();
    this.ticketsService.toggleArchivar(ticket.id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          if (this.ticketSeleccionado?.id === ticket.id) this.ticketSeleccionado = null;
          this.cargarTickets();
        });
      },
    });
  }

  // ================================================================
  // CRUD MODALES
  // ================================================================
  createTicket(): void {
    const modalRef = this.modalService.open(CreateTicketsComponent, { centered: true, size: 'lg' });
    modalRef.componentInstance.TicketCreado.subscribe((ticket: Ticket) => {
      this.ngZone.run(() => {
        this.tickets.unshift(ticket);
        this.cargarMetricas();
        this.cdr.detectChanges();
      });
    });
  }

  editTicket(ticket: Ticket, event: Event): void {
    event.stopPropagation();
    const modalRef = this.modalService.open(EditTicketsComponent, { centered: true, size: 'lg' });
    modalRef.componentInstance.TICKET_SELECTED = ticket;
    modalRef.componentInstance.TicketEditado.subscribe((updated: Ticket) => {
      this.ngZone.run(() => {
        const idx = this.tickets.findIndex(t => t.id === ticket.id);
        if (idx !== -1) this.tickets[idx] = updated;
        if (this.ticketSeleccionado?.id === ticket.id) this.ticketSeleccionado = updated;
        this.cdr.detectChanges();
      });
    });
  }

  deleteTicket(ticket: Ticket, event: Event): void {
    event.stopPropagation();
    const modalRef = this.modalService.open(DeleteTicketsComponent, { centered: true, size: 'sm' });
    modalRef.componentInstance.TICKET_SELECTED = ticket;
    modalRef.componentInstance.TicketEliminado.subscribe(() => {
      this.ngZone.run(() => {
        const idx = this.tickets.findIndex(t => t.id === ticket.id);
        if (idx !== -1) this.tickets.splice(idx, 1);
        if (this.ticketSeleccionado?.id === ticket.id) this.ticketSeleccionado = null;
        this.cargarMetricas();
        this.cdr.detectChanges();
      });
    });
  }

  // ================================================================
  // HELPERS
  // ================================================================
  getPrioridadClass(p: string): string  { return this.ticketsService.getPrioridadClass(p); }
  getEstadoClass(e: string): string     { return this.ticketsService.getEstadoClass(e); }
  getEstadoLabel(e: string): string     { return this.ticketsService.getEstadoLabel(e); }
  formatFileSize(b: number): string     { return this.ticketsService.formatFileSize(b); }

  getAvatarUrl(avatar: string | null): string {
    if (!avatar) return 'assets/media/avatars/blank.png';
    if (avatar.startsWith('http')) return avatar;
    return `assets/media/avatars/${avatar}`;
  }

  trackById(_: number, item: Ticket): number { return item.id; }
}
