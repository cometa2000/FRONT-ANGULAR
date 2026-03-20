import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from 'src/app/modules/auth';

// ================================================================
// INTERFACES
// ================================================================

export interface TicketTareaAdjunta {
  id: number;
  ticket_message_id: number | null;
  tarea_id: number;
  tarea_name: string;
  tarea_status: 'pendiente' | 'en_progreso' | 'completada' | string;
  tarea_priority: 'low' | 'medium' | 'high' | string;
  tarea_due_date: string | null;
  tarea_grupo_id: number;
  tarea_progress: number;
  created_at: string;
}

export interface TareaDisponible {
  id: number;
  name: string;
  status: string;
  priority: string;
  due_date: string | null;
  grupo_id: number;
  grupo_name: string;
  lista_id: number | null;
  lista_name: string | null;
  total_checklist_progress: number;
}

export interface Ticket {
  id: number;
  folio: string;
  asunto: string;
  descripcion: string;
  categoria?: string;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'pendiente' | 'en_proceso' | 'en_espera' | 'resuelto' | 'cerrado' | 'rechazado';
  tipo_origen: 'sede' | 'sucursal';
  tipo_destino: 'area_sede' | 'sucursal';
  es_favorito: boolean;
  archivado: boolean;
  fecha_limite?: string;
  fecha_cierre?: string;
  is_vencido: boolean;
  messages_count: number;
  creador?: { id: number; nombre: string; avatar: string };
  asignado?: { id: number; nombre: string; avatar: string };
  sucursal_origen?: { id: number; nombre: string };
  sucursal_destino?: { id: number; nombre: string };
  rol_destino?: { id: number; nombre: string };
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  status_history?: TicketStatusHistoryItem[];
  assignments?: TicketAssignmentItem[];
  metricas_ticket?: {
    tiempo_primera_respuesta_min: number | null;
    tiempo_resolucion_horas: number | null;
  };
  // ── TAREAS ADJUNTAS (evidencias opcionales) ──
  tareas_adjuntas?: TicketTareaAdjunta[];
}

export interface TicketMessage {
  id: number;
  contenido: string;
  es_nota_interna: boolean;
  user: { id: number; nombre: string; avatar: string } | null;
  adjuntos: TicketAttachment[];
  created_at: string;
  // ── Tareas adjuntas a este mensaje del hilo ──
  tareas_adjuntas?: TicketTareaAdjunta[];
}

export interface TicketAttachment {
  id: number;
  nombre: string;
  mime_type: string;
  tamanio: number;
  file_url: string;
}

export interface TicketStatusHistoryItem {
  id: number;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  usuario: string | null;
  created_at: string;
}

export interface TicketAssignmentItem {
  id: number;
  asignado_por: string;
  asignado_a: string;
  motivo: string | null;
  created_at: string;
}

export interface TicketConfig {
  tipo_usuario: 'sede' | 'sucursal';
  es_sede: boolean;
  destinos: { id: number; name: string }[];
}

export interface TicketMetricas {
  total: number;
  bandeja: number;
  enviados: number;
  en_proceso: number;
  finalizados: number;
  archivados: number;
  favoritos: number;
  vencidos: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
}

// ================================================================
// SERVICE
// ================================================================

@Injectable({
  providedIn: 'root',
})
export class TicketsService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  metricasSubject = new BehaviorSubject<TicketMetricas | null>(null);
  metricas$ = this.metricasSubject.asObservable();

  private readonly BASE_URL = `${URL_SERVICIOS}/sistema-de-tickets`;

  constructor(
    private http: HttpClient,
    public authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  // ================================================================
  // HELPERS PRIVADOS
  // ================================================================

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
  }

  private getFileHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authservice.token,
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Ocurrió un error desconocido';
    if (error.status === 401) msg = 'No autorizado. Por favor, inicia sesión nuevamente.';
    else if (error.status === 404) msg = 'Recurso no encontrado.';
    else if (error.status === 422) msg = 'Datos inválidos.';
    else if (error.status === 500) msg = 'Error interno del servidor.';
    console.error('❌ TicketsService error:', error.status, error.message, error.error);
    return throwError(() => {
      return { status: error.status, error: error.error, userMessage: msg, originalError: error };
    });
  }

  // ================================================================
  // TICKETS — CRUD
  // ================================================================

  getTickets(params: {
    vista?: string;
    estado?: string;
    prioridad?: string;
    search?: string;
    page?: number;
  } = {}): Observable<{ message: number; total: number; tickets: Ticket[] }> {
    this.isLoadingSubject.next(true);
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http
      .get<any>(`${this.BASE_URL}/tickets`, { headers: this.getHeaders(), params: httpParams })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getTicket(id: number): Observable<{ message: number; ticket: Ticket }> {
    return this.http
      .get<any>(`${this.BASE_URL}/tickets/${id}`, { headers: this.getHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  createTicket(data: FormData): Observable<{ message: number; ticket: Ticket }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<any>(`${this.BASE_URL}/tickets`, data, { headers: this.getFileHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateTicket(id: number, data: FormData): Observable<{ message: number; ticket: Ticket }> {
    this.isLoadingSubject.next(true);
    data.append('_method', 'PUT');
    return this.http
      .post<any>(`${this.BASE_URL}/tickets/${id}`, data, { headers: this.getFileHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteTicket(id: number): Observable<{ message: number }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<any>(`${this.BASE_URL}/tickets/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  // ================================================================
  // ACCIONES
  // ================================================================

  cambiarEstado(id: number, estado: string, comentario?: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .patch(`${this.BASE_URL}/tickets/${id}/estado`, { estado, comentario }, { headers: this.getHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  reasignar(id: number, asignado_id: number, motivo?: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .patch(`${this.BASE_URL}/tickets/${id}/reasignar`, { asignado_id, motivo }, { headers: this.getHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  toggleFavorito(id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .patch(`${this.BASE_URL}/tickets/${id}/favorito`, {}, { headers: this.getHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  toggleArchivar(id: number): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .patch(`${this.BASE_URL}/tickets/${id}/archivar`, {}, { headers: this.getHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  sendMessage(ticketId: number, data: FormData): Observable<{ message: number; mensaje: TicketMessage }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<any>(`${this.BASE_URL}/tickets/${ticketId}/messages`, data, { headers: this.getFileHeaders() })
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  // ================================================================
  // CONFIG Y MÉTRICAS
  // ================================================================

  getConfig(): Observable<TicketConfig> {
    return this.http
      .get<TicketConfig>(`${this.BASE_URL}/config`, { headers: this.getHeaders() })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('❌ getConfig error:', error.status, error.error);
          return throwError(() => ({
            status: error.status,
            error: error.error,
            userMessage: error.error?.error || 'Error al cargar configuración',
          }));
        })
      );
  }

  getMetricas(): Observable<{ message: number; metricas: TicketMetricas }> {
    return this.http
      .get<any>(`${this.BASE_URL}/metricas`, { headers: this.getHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  // ================================================================
  // TAREAS — RELACIÓN CON TICKETS
  // ================================================================

  getTareasDisponibles(): Observable<{ message: number; tareas: TareaDisponible[] }> {
    return this.http
      .get<any>(`${this.BASE_URL}/tareas-disponibles`, { headers: this.getHeaders() })
      .pipe(catchError((e) => this.handleError(e)));
  }

  adjuntarTarea(
    ticketId: number,
    tareaId: number,
    mensajeId: number | null = null
  ): Observable<{ message: number; ticket_tarea: TicketTareaAdjunta }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<any>(
        `${this.BASE_URL}/tickets/${ticketId}/adjuntar-tarea`,
        { tarea_id: tareaId, ticket_message_id: mensajeId },
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  quitarTarea(ticketId: number, ticketTareaId: number): Observable<{ message: number }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<any>(
        `${this.BASE_URL}/tickets/${ticketId}/adjuntar-tarea/${ticketTareaId}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        catchError((e) => this.handleError(e)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  // ================================================================
  // HELPERS DE PRESENTACIÓN
  // ================================================================

  getPrioridadClass(prioridad: string): string {
    const map: Record<string, string> = { alta: 'danger', media: 'warning', baja: 'success' };
    return map[prioridad] ?? 'secondary';
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente:  'warning',
      en_proceso: 'primary',
      en_espera:  'info',
      resuelto:   'success',
      cerrado:    'dark',
      rechazado:  'danger',
    };
    return map[estado] ?? 'secondary';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente:  'Pendiente',
      en_proceso: 'En Proceso',
      en_espera:  'En Espera',
      resuelto:   'Resuelto',
      cerrado:    'Cerrado',
      rechazado:  'Rechazado',
    };
    return map[estado] ?? estado;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getTareaStatusClass(status: string): string {
    const map: Record<string, string> = {
      pendiente:   'warning',
      en_progreso: 'primary',
      completada:  'success',
    };
    return map[status] ?? 'secondary';
  }

  getTareaStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente:   'Pendiente',
      en_progreso: 'En progreso',
      completada:  'Completada',
    };
    return map[status] ?? status;
  }

  getTareaPriorityClass(priority: string): string {
    const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'success' };
    return map[priority] ?? 'secondary';
  }
}