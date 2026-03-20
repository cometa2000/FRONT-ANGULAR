import {
  Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil, interval, Subscription } from 'rxjs';
import { TicketsService, Ticket, TicketMessage, TicketMetricas, TicketConfig } from '../service/tickets.service';
import { CreateTicketsComponent } from '../create-tickets/create-tickets.component';
import { EditTicketsComponent } from '../edit-tickets/edit-tickets.component';
import { DeleteTicketsComponent } from '../delete-tickets/delete-tickets.component';
import { ModalAdjuntosTicketsComponent, AdjuntoTicket } from '../modal-adjuntos-tickets/modal-adjuntos-tickets.component';
import { VistaDocumentoService } from 'src/app/modules/documents/vista-documentos/service/vista-documento.service';
import { ModalTareasTicketsComponent } from '../modal-tareas-tickets/modal-tareas-tickets.component';
import { TareaDisponible, TicketTareaAdjunta } from '../service/tickets.service';
import { EditTareaComponent } from 'src/app/modules/tasks/tareas/edit-tarea/edit-tarea.component';


@Component({
  selector: 'app-list-tickets',
  templateUrl: './list-tickets.component.html',
  styleUrls: ['./list-tickets.component.scss'],
})
export class ListTicketsComponent implements OnInit, OnDestroy, AfterViewChecked {

  private destroy$ = new Subject<void>();

  // ── Referencia al contenedor de mensajes para auto-scroll ──
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  // ── Estado principal ──
  tickets: Ticket[] = [];
  ticketSeleccionado: Ticket | null = null;
  metricas: TicketMetricas | null = null;
  config: TicketConfig | null = null;
  isLoading$: any;

  // ── Vista activa ──
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

  readonly todosLosEstados = [
    { value: 'pendiente',  label: 'Pendiente',  class: 'warning' },
    { value: 'en_proceso', label: 'En Proceso', class: 'primary' },
    { value: 'en_espera',  label: 'En Espera',  class: 'info'    },
    { value: 'resuelto',   label: 'Resuelto',   class: 'success' },
    { value: 'cerrado',    label: 'Cerrado',     class: 'dark'    },
    { value: 'rechazado',  label: 'Rechazado',   class: 'danger'  },
  ];

  // ── Mensaje nuevo ──
  nuevoMensaje: string = '';
  /** Adjuntos pendientes: nuevos, existentes del sistema o URLs */
  adjuntosPendientes: AdjuntoTicket[] = [];
  isSendingMessage: boolean = false;

  // ================================================================
  // POLLING — TIEMPO REAL
  // ================================================================

  /** Intervalo en ms para refrescar mensajes del ticket activo */
  private readonly POLL_MESSAGES_MS = 5000;
  /** Intervalo en ms para refrescar métricas del sidebar */
  private readonly POLL_METRICAS_MS = 15000;

  private pollingMessages$: Subscription | null = null;
  private pollingMetricas$: Subscription | null = null;

  /** Bandera para evitar peticiones solapadas */
  private isPollingMessages = false;

  constructor(
    public modalService: NgbModal,
    public ticketsService: TicketsService,
    private vistaDocService: VistaDocumentoService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  // ================================================================
  // LIFECYCLE
  // ================================================================

  ngOnInit(): void {
    this.isLoading$ = this.ticketsService.isLoading$;

    this.ticketsService.getConfig().subscribe({
      next: (cfg: any) => {
        this.ngZone.run(() => {
          this.config = cfg;
          this.cdr.detectChanges();
        });
      },
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const vista = params['vista'] || 'bandeja';
      if (vista !== this.vistaActiva) {
        this.vistaActiva = vista;
        this.filtroSearch = '';
        this.filtroPrioridad = '';
        this.ticketSeleccionado = null;
        // Cambió la vista → detener polling de mensajes
        this.detenerPollingMensajes();
      }
      this.cargarTickets();
      this.cargarMetricas();
    });

    // Iniciar polling de métricas globales
    this.iniciarPollingMetricas();
  }

  ngAfterViewChecked(): void {
    // Auto-scroll al fondo cuando llegan mensajes nuevos
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detenerPollingMensajes();
    this.detenerPollingMetricas();
  }

  // ================================================================
  // POLLING — MENSAJES EN TIEMPO REAL
  // ================================================================

  /**
   * Inicia el polling de mensajes para el ticket actualmente seleccionado.
   * Llama al endpoint getTicket cada POLL_MESSAGES_MS ms y compara
   * el conteo de mensajes para detectar mensajes nuevos de otros usuarios.
   */
  private iniciarPollingMensajes(ticketId: number): void {
    this.detenerPollingMensajes();

    this.pollingMessages$ = interval(this.POLL_MESSAGES_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // No hacer polling si ya hay una petición en vuelo o
        // el usuario está escribiendo (para no interrumpir la UX)
        if (this.isPollingMessages || !this.ticketSeleccionado) return;
        if (this.ticketSeleccionado.id !== ticketId) {
          this.detenerPollingMensajes();
          return;
        }
        this.isPollingMessages = true;

        this.ticketsService.getTicket(ticketId).subscribe({
          next: (resp: any) => {
            this.ngZone.run(() => {
              const ticketActualizado: Ticket = resp.ticket;
              const mensajesNuevos = ticketActualizado.messages ?? [];
              const cantidadActual = this.ticketSeleccionado?.messages?.length ?? 0;

              if (mensajesNuevos.length > cantidadActual) {
                // Hay mensajes nuevos → actualizar la conversación
                this.ticketSeleccionado!.messages = mensajesNuevos;
                // También actualizar estado y otros campos por si cambiaron
                this.ticketSeleccionado!.estado  = ticketActualizado.estado;
                this.ticketSeleccionado!.is_vencido = ticketActualizado.is_vencido;
                this.shouldScrollToBottom = true;
                // Actualizar el ticket en la lista también
                const idx = this.tickets.findIndex(t => t.id === ticketId);
                if (idx !== -1) {
                  this.tickets[idx].messages_count = mensajesNuevos.length;
                  this.tickets[idx].estado = ticketActualizado.estado;
                }
                this.cdr.detectChanges();
              }

              this.isPollingMessages = false;
            });
          },
          error: () => {
            this.isPollingMessages = false;
          },
        });
      });
  }

  private detenerPollingMensajes(): void {
    if (this.pollingMessages$) {
      this.pollingMessages$.unsubscribe();
      this.pollingMessages$ = null;
    }
    this.isPollingMessages = false;
  }

  // ================================================================
  // POLLING — MÉTRICAS EN TIEMPO REAL (badges sidebar)
  // ================================================================

  /**
   * Polling de métricas cada POLL_METRICAS_MS ms.
   * Emite el resultado a través de TicketsService para que
   * el SidebarMenuComponent también se actualice automáticamente.
   */
  private iniciarPollingMetricas(): void {
    this.pollingMetricas$ = interval(this.POLL_METRICAS_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cargarMetricas();
      });
  }

  private detenerPollingMetricas(): void {
    if (this.pollingMetricas$) {
      this.pollingMetricas$.unsubscribe();
      this.pollingMetricas$ = null;
    }
  }

  // ================================================================
  // AUTO SCROLL
  // ================================================================

  private scrollToBottom(): void {
    try {
      if (this.chatContainer?.nativeElement) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }

  // ================================================================
  // HELPERS DE VISTA
  // ================================================================

  getVistaLabel(): string {
    return this.vistaLabels[this.vistaActiva] ?? this.vistaActiva;
  }

  // ================================================================
  // GETTERS DE IDENTIDAD
  // ================================================================

  private get miUserId(): number | undefined {
    return this.ticketsService.authservice.user?.id;
  }

  get esElAsignado(): boolean {
    if (!this.ticketSeleccionado || !this.miUserId) return false;
    return this.ticketSeleccionado.asignado?.id === this.miUserId;
  }

  get estaFinalizado(): boolean {
    return ['cerrado', 'rechazado'].includes(this.ticketSeleccionado?.estado ?? '');
  }

  get esElCreador(): boolean {
    if (!this.ticketSeleccionado || !this.miUserId) return false;
    return this.ticketSeleccionado.creador?.id === this.miUserId;
  }

  esMiMensaje(msg: TicketMessage): boolean {
    if (!this.miUserId || !msg.user) return false;
    return msg.user.id === this.miUserId;
  }

  get estadosDisponiblesParaUsuario() {
    return this.todosLosEstados;
  }

  // ================================================================
  // CARGA DE DATOS
  // ================================================================

  cargarMetricas(): void {
    this.ticketsService.getMetricas().subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          this.metricas = resp.metricas;
          // Emitir al servicio compartido para que el sidebar lo recoja
          this.ticketsService.metricasSubject.next(resp.metricas);
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
    this.detenerPollingMensajes();
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
    // Detener polling anterior antes de cargar el nuevo ticket
    this.detenerPollingMensajes();
    this.cdr.detectChanges();

    this.ticketsService.getTicket(ticket.id).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          this.ticketSeleccionado = resp.ticket;
          this.lastMessageCount = resp.ticket.messages?.length ?? 0;
          this.isLoadingDetalle = false;
          this.nuevoMensaje = '';
          this.adjuntosPendientes = [];
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
          // Iniciar polling de mensajes para este ticket
          this.iniciarPollingMensajes(ticket.id);
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
    this.detenerPollingMensajes();
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

  // ================================================================
  // MODAL DE ADJUNTOS
  // ================================================================

  abrirModalAdjuntos(): void {
    const ref = this.modalService.open(ModalAdjuntosTicketsComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });
    // Pasar la sucursal del ticket para filtrar el explorador de archivos
    ref.componentInstance.sucursaleId =
      (this.ticketSeleccionado as any)?.sucursal_origen?.id ?? null;

    ref.componentInstance.AdjuntosSeleccionados.subscribe((adjuntos: AdjuntoTicket[]) => {
      this.ngZone.run(() => {
        this.adjuntosPendientes = [...this.adjuntosPendientes, ...adjuntos];
        this.cdr.detectChanges();
      });
    });
  }

  quitarAdjuntoPendiente(i: number): void {
    this.adjuntosPendientes.splice(i, 1);
    this.cdr.detectChanges();
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

  // ================================================================
  // ENVIAR MENSAJE
  // ================================================================

  enviarMensaje(): void {
    if (!this.ticketSeleccionado) return;
    const hayTexto    = this.nuevoMensaje.trim().length > 0;
    const hayAdjuntos = this.adjuntosPendientes.length > 0;
    if (!hayTexto && !hayAdjuntos) return;

    this.isSendingMessage = true;
    this.cdr.detectChanges();

    // Capturar antes de limpiar (fire & forget los que van al sistema de archivos)
    const paraSistema = this.adjuntosPendientes
      .filter(a => a.tipo === 'nuevo' && (a as any).guardarEnSistema) as any[];

    const fd = new FormData();
    fd.append('contenido', this.nuevoMensaje.trim() || '📎 Adjunto(s)');

    // TIPO 1: archivos nuevos
    (this.adjuntosPendientes.filter(a => a.tipo === 'nuevo') as any[])
      .forEach((a: any) => fd.append('adjuntos[]', a.file));

    // TIPO 2: documentos existentes (referencia, sin clonar)
    (this.adjuntosPendientes.filter(a => a.tipo === 'existente') as any[])
      .forEach((a: any) => fd.append('documento_ids[]', String(a.documento_id)));

    // TIPO 3: URLs externas
    const urls = this.adjuntosPendientes.filter(a => a.tipo === 'url') as any[];
    if (urls.length > 0) {
      fd.append('adjuntos_url', JSON.stringify(
        urls.map((u: any) => ({ titulo: u.titulo, url: u.url }))
      ));
    }

    this.ticketsService.sendMessage(this.ticketSeleccionado.id, fd).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          if (!this.ticketSeleccionado!.messages) this.ticketSeleccionado!.messages = [];
          this.ticketSeleccionado!.messages.push(resp.mensaje);
          this.nuevoMensaje = '';
          this.adjuntosPendientes = [];
          this.isSendingMessage = false;
          this.shouldScrollToBottom = true;
          const idx = this.tickets.findIndex(t => t.id === this.ticketSeleccionado!.id);
          if (idx !== -1) this.tickets[idx].messages_count++;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => { this.isSendingMessage = false; this.cdr.detectChanges(); });
      },
    });

    // Fire & forget: subir al sistema de archivos los que el usuario marcó
    const sucId = (this.ticketSeleccionado as any)?.sucursal_origen?.id ?? null;
    paraSistema.forEach((a: any) => {
      const docFd = new FormData();
      docFd.append('file', a.file);
      docFd.append('name', a.file.name);
      if (sucId) docFd.append('sucursale_id', String(sucId));
      if (a.carpetaDestino) docFd.append('parent_id', String(a.carpetaDestino));
      this.vistaDocService.uploadFile(docFd).subscribe({ error: () => {} });
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
          if (this.vistaActiva === 'favoritos' && !resp.es_favorito) {
            this.tickets = this.tickets.filter(t => t.id !== ticket.id);
            if (this.ticketSeleccionado?.id === ticket.id) {
              this.ticketSeleccionado = null;
              this.detenerPollingMensajes();
            }
          }
          this.cargarMetricas();
          this.cdr.detectChanges();
        });
      },
    });
  }

  archivar(ticket: Ticket, event: Event): void {
    event.stopPropagation();
    this.ticketsService.toggleArchivar(ticket.id).subscribe({
      next: (resp: any) => {
        this.ngZone.run(() => {
          ticket.archivado = resp.archivado;
          if (this.ticketSeleccionado?.id === ticket.id) {
            this.ticketSeleccionado.archivado = resp.archivado;
          }
          if (resp.archivado && this.vistaActiva !== 'archivados') {
            this.tickets = this.tickets.filter(t => t.id !== ticket.id);
            if (this.ticketSeleccionado?.id === ticket.id) {
              this.ticketSeleccionado = null;
              this.detenerPollingMensajes();
            }
          }
          if (!resp.archivado && this.vistaActiva === 'archivados') {
            this.tickets = this.tickets.filter(t => t.id !== ticket.id);
            if (this.ticketSeleccionado?.id === ticket.id) {
              this.ticketSeleccionado = null;
              this.detenerPollingMensajes();
            }
          }
          this.cargarMetricas();
          this.cdr.detectChanges();
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
        if (this.ticketSeleccionado?.id === ticket.id) {
          this.ticketSeleccionado = null;
          this.detenerPollingMensajes();
        }
        this.cargarMetricas();
        this.cdr.detectChanges();
      });
    });
  }
  

  abrirModalTareas(): void {
    if (!this.ticketSeleccionado) return;

    const ref = this.modalService.open(ModalTareasTicketsComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    });

    ref.componentInstance.TareasSeleccionadas.subscribe((tareas: TareaDisponible[]) => {
      this.ngZone.run(() => {
        tareas.forEach((t) => {
          // Adjuntar directamente (sin mensaje de texto obligatorio)
          // Se adjunta a través del endpoint dedicado para no mezclar con el flujo de mensajes
          this.ticketsService
            .adjuntarTarea(this.ticketSeleccionado!.id, t.id, null)
            .subscribe({
              next: (resp) => {
                // Agregar la tarea a la lista local del ticket (tareas_adjuntas)
                if (!this.ticketSeleccionado!.tareas_adjuntas) {
                  this.ticketSeleccionado!.tareas_adjuntas = [];
                }
                this.ticketSeleccionado!.tareas_adjuntas!.push(resp.ticket_tarea);
                this.cdr.detectChanges();
              },
            });
        });
      });
    });
  }

  // ── 3) MÉTODO — quitar tarea adjunta ─────────────────────────────────
  quitarTareaAdjunta(tareaAdj: TicketTareaAdjunta): void {
    if (!this.ticketSeleccionado) return;
    this.ticketsService
      .quitarTarea(this.ticketSeleccionado.id, tareaAdj.id)
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            if (this.ticketSeleccionado?.tareas_adjuntas) {
              this.ticketSeleccionado.tareas_adjuntas =
                this.ticketSeleccionado.tareas_adjuntas.filter((t) => t.id !== tareaAdj.id);
            }
            this.cdr.detectChanges();
          });
        },
      });
  }

  abrirTarea(tareaAdj: TicketTareaAdjunta): void {
    const ref = this.modalService.open(EditTareaComponent, {
      centered: true,
      size: 'xl',
      windowClass: 'modal-fullscreen-xl',
      backdrop: 'static',
    });

    // Pasar el ID de la tarea
    ref.componentInstance.TAREA_SELECTED = { id: tareaAdj.tarea_id };

    // ⚡ CLAVE: forzar solo lectura — NO pasar grupo_id
    // checkWritePermissions() en edit-tarea hace un early return con
    // hasWriteAccess = false cuando grupo_id está undefined/null.
    // Por lo tanto no pasamos grupo_id y el componente queda en read-only.
    // (ver edit-tarea.component.ts líneas 305-310)
    ref.componentInstance.grupo_id   = undefined;
    ref.componentInstance.isReadOnly = true;   // flag directo
    ref.componentInstance.hasWriteAccess = false; // refuerzo
  }

  // ================================================================
  // HELPERS
  // ================================================================

  getTareaStatusClass(s: string)  { return this.ticketsService.getTareaStatusClass(s);  }
  getTareaStatusLabel(s: string)  { return this.ticketsService.getTareaStatusLabel(s);  }
  getTareaPriorityClass(p: string){ return this.ticketsService.getTareaPriorityClass(p); }

  getTareaProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-success';
    if (progress >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  getPrioridadClass(p: string): string  { return this.ticketsService.getPrioridadClass(p); }
  getEstadoClass(e: string): string     { return this.ticketsService.getEstadoClass(e); }
  getEstadoLabel(e: string): string     { return this.ticketsService.getEstadoLabel(e); }
  formatFileSize(b: number): string     { return this.ticketsService.formatFileSize(b); }

  getAvatarUrl(avatar: string | null | undefined): string {
    if (!avatar) return 'assets/media/avatars/blank.png';
    if (avatar.startsWith('http')) return avatar;
    return `assets/media/avatars/${avatar}`;
  }

  trackById(_: number, item: Ticket): number { return item.id; }

  
}