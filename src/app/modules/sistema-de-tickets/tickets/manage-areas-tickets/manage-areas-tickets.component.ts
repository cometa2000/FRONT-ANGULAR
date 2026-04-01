import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketsService, TicketArea, UsuarioSede } from '../service/tickets.service';

@Component({
  selector: 'app-manage-areas-tickets',
  templateUrl: './manage-areas-tickets.component.html',
  styleUrls: ['./manage-areas-tickets.component.scss'],
})
export class ManageAreasTicketsComponent implements OnInit {

  areas: TicketArea[]     = [];
  usuarios: UsuarioSede[] = [];

  isLoading         = false;
  isLoadingUsuarios = false;
  isSaving          = false;

  /**
   * null     → vista lista
   * 'new'    → formulario crear
   * number   → id del área que se está editando (FIX TS2367: no mezclar TicketArea con string)
   */
  modo: null | 'new' | number = null;

  /** Área seleccionada para editar (útil para recuperar datos en el template) */
  areaEditando: TicketArea | null = null;

  form: FormGroup;
  errorMsg: string | null = null;
  confirmarEliminar: TicketArea | null = null;

  constructor(
    public modal: NgbActiveModal,
    private ticketsService: TicketsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.maxLength(150)]],
      descripcion:    ['', Validators.maxLength(500)],
      responsable_id: [null, Validators.required],
      activo:         [true],
    });
  }

  ngOnInit(): void {
    this.cargarAreas();
    this.cargarUsuarios();
  }

  // ================================================================
  // CARGA
  // ================================================================

  cargarAreas(): void {
    this.isLoading = true;
    this.ticketsService.getAreas().subscribe({
      next: resp => {
        this.areas     = resp.areas;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarUsuarios(): void {
    this.isLoadingUsuarios = true;
    this.ticketsService.getUsuariosSede().subscribe({
      next: resp => {
        this.usuarios          = resp.usuarios;
        this.isLoadingUsuarios = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingUsuarios = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ================================================================
  // MODOS
  // ================================================================

  abrirCrear(): void {
    this.modo         = 'new';
    this.areaEditando = null;
    this.errorMsg     = null;
    this.form.reset({ activo: true, nombre: '', descripcion: '', responsable_id: null });
  }

  abrirEditar(area: TicketArea): void {
    this.modo         = area.id;   // guardamos el ID, no el objeto completo
    this.areaEditando = area;
    this.errorMsg     = null;
    this.form.patchValue({
      nombre:         area.nombre,
      descripcion:    area.descripcion ?? '',
      responsable_id: area.responsable?.id ?? null,
      activo:         area.activo,
    });
  }

  cancelar(): void {
    this.modo         = null;
    this.areaEditando = null;
    this.errorMsg     = null;
  }

  /** Helper para el template: true si estamos en modo lista */
  get esModoLista(): boolean { return this.modo === null; }
  /** Helper para el template: true si estamos en modo crear o editar */
  get esModoFormulario(): boolean { return this.modo !== null; }
  /** Helper para el template: true si estamos creando */
  get esModoNew(): boolean { return this.modo === 'new'; }

  // ================================================================
  // GUARDAR
  // ================================================================

  guardar(): void {
    if (this.form.invalid) return;

    const val     = this.form.value;
    this.isSaving = true;
    this.errorMsg = null;

    if (this.modo === 'new') {
      // ── CREAR ──
      this.ticketsService.createArea(val).subscribe({
        next: resp => {
          this.areas.unshift(resp.area);
          this.modo         = null;
          this.areaEditando = null;
          this.isSaving     = false;
          this.cdr.detectChanges();
        },
        error: err => {
          this.errorMsg = err?.userMessage ?? 'Error al crear el área';
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    } else if (typeof this.modo === 'number') {
      // ── EDITAR — FIX TS2367: modo es number, no TicketArea ──
      const areaId = this.modo;
      this.ticketsService.updateArea(areaId, val).subscribe({
        next: resp => {
          const idx = this.areas.findIndex(a => a.id === areaId);
          if (idx !== -1) this.areas[idx] = resp.area;
          this.modo         = null;
          this.areaEditando = null;
          this.isSaving     = false;
          this.cdr.detectChanges();
        },
        error: err => {
          this.errorMsg = err?.userMessage ?? 'Error al actualizar el área';
          this.isSaving = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  // ================================================================
  // ELIMINAR
  // ================================================================

  solicitarEliminar(area: TicketArea, event: Event): void {
    event.stopPropagation();
    this.confirmarEliminar = area;
  }

  cancelarEliminar(): void {
    this.confirmarEliminar = null;
  }

  eliminar(): void {
    if (!this.confirmarEliminar) return;
    const area = this.confirmarEliminar;

    this.ticketsService.deleteArea(area.id).subscribe({
      next: () => {
        this.areas             = this.areas.filter(a => a.id !== area.id);
        this.confirmarEliminar = null;
        this.cdr.detectChanges();
      },
      error: err => {
        this.errorMsg          = err?.userMessage ?? 'Error al eliminar el área';
        this.confirmarEliminar = null;
        this.cdr.detectChanges();
      },
    });
  }

  // ================================================================
  // HELPERS
  // ================================================================

  getAvatarUrl(avatar: string | null | undefined): string {
    if (!avatar)                  return 'assets/media/avatars/blank.png';
    if (avatar.startsWith('http')) return avatar;
    return `assets/media/avatars/${avatar}`;
  }
}