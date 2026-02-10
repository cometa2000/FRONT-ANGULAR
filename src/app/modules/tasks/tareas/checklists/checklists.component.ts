import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ChecklistsService, Checklist } from '../service/checklists.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checklists',
  templateUrl: './checklists.component.html',
  styleUrls: ['./checklists.component.scss']
})
export class ChecklistsComponent implements OnInit, OnChanges {
  @Input() tareaId!: number;
  @Input() grupoId!: number; // ✅ CRÍTICO: Recibir grupoId desde el componente padre
  @Output() checklistsChanged = new EventEmitter<void>();

  showModal = false;
  checklistName = '';
  editingChecklist: Checklist | null = null;

  // ✅ Para copiar checklists
  availableChecklists: any[] = [];
  selectedChecklistToCopy: number | null = null;
  isCopyMode = false;

  constructor(
    private checklistsService: ChecklistsService
  ) {}

  ngOnInit(): void {
    console.log('🎯 Checklist Component - Tarea ID:', this.tareaId);
    console.log('📂 Checklist Component - Grupo ID:', this.grupoId);
    
    // ✅ VALIDACIÓN NO BLOQUEANTE en ngOnInit
    if (!this.grupoId) {
      console.warn('⚠️ ADVERTENCIA: grupoId no está disponible en ngOnInit');
      console.log('📌 Esto es normal si los datos aún no han cargado');
    }
  }

  // ✅ NUEVO: Detectar cambios en los @Input()
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grupoId']) {
      console.log('🔄 Cambio detectado en grupoId:', {
        anterior: changes['grupoId'].previousValue,
        actual: changes['grupoId'].currentValue,
        primerCambio: changes['grupoId'].firstChange
      });
      
      // Si grupoId cambió y ahora tiene valor, log de confirmación
      if (this.grupoId) {
        console.log('✅ grupoId ahora disponible:', this.grupoId);
      }
    }
  }

  openModal(checklist?: Checklist): void {
    // ✅ VALIDACIÓN CRÍTICA: Verificar grupoId SOLO cuando NO es edición
    if (!checklist && !this.grupoId) {
      console.error('❌ ERROR CRÍTICO: grupoId no está disponible');
      console.log('📊 Estado actual:', {
        tareaId: this.tareaId,
        grupoId: this.grupoId,
        checklist: checklist
      });
      
      Swal.fire({
        icon: 'error',
        title: 'Error de configuración',
        text: 'No se pudo cargar la información del grupo. Por favor, recarga la página.',
        confirmButtonColor: '#EB5A46'
      });
      return;
    }

    if (checklist) {
      // Modo edición
      this.editingChecklist = checklist;
      this.checklistName = checklist.name;
      this.isCopyMode = false;
      this.selectedChecklistToCopy = null;
      this.availableChecklists = [];
    } else {
      // Modo creación
      this.editingChecklist = null;
      this.checklistName = '';
      this.isCopyMode = false;
      this.selectedChecklistToCopy = null;
      
      // ✅ CORRECCIÓN: Cargar checklists SOLO cuando se abre la modal
      console.log('📋 Intentando cargar checklists con grupoId:', this.grupoId);
      this.loadAvailableChecklists();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.checklistName = '';
    this.editingChecklist = null;
    this.selectedChecklistToCopy = null;
    this.isCopyMode = false;
    this.availableChecklists = [];
  }

  /**
   * ✅ CORRECCIÓN: Cargar checklists disponibles del grupo para copiar
   */
  loadAvailableChecklists(): void {
    // ✅ VALIDACIÓN CRÍTICA
    if (!this.grupoId) {
      console.error('❌ ERROR: No se puede cargar checklists sin grupoId');
      console.log('📊 Estado actual:', {
        tareaId: this.tareaId,
        grupoId: this.grupoId
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Información no disponible',
        text: 'No se pudieron cargar los checklists disponibles. Puedes crear uno nuevo.',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    console.log('🔍 Cargando checklists del grupo:', this.grupoId);

    this.checklistsService.getGroupChecklists(this.grupoId).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta del servidor:', resp);
        
        // ✅ Filtrar checklists de la tarea actual
        this.availableChecklists = (resp.checklists || []).filter((cl: any) => {
          return cl.tarea_id !== this.tareaId;
        });
        
        console.log('📋 Checklists disponibles (filtrados):', this.availableChecklists);
        
        if (this.availableChecklists.length === 0) {
          console.log('ℹ️ No hay checklists disponibles para copiar');
          console.log('💡 Razones posibles:');
          console.log('   1. No existen otros checklists en este grupo');
          console.log('   2. Todos los checklists pertenecen a esta tarea');
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar checklists del grupo:', error);
        console.error('🔍 Detalles completos:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los checklists disponibles',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }

  /**
   * ✅ Al seleccionar un checklist para copiar
   */
  onSelectChecklistToCopy(): void {
    if (this.selectedChecklistToCopy) {
      this.isCopyMode = true;
      
      // ✅ VALIDACIÓN: Si hay nombre escrito, mostrar advertencia
      if (this.checklistName.trim().length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Validación',
          text: 'Solo puedes crear un checklist nuevo O copiar uno existente, no ambos',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        // Limpiar selección
        this.selectedChecklistToCopy = null;
        this.isCopyMode = false;
        return;
      }
    } else {
      this.isCopyMode = false;
    }
  }

  /**
   * ✅ Validar si se puede guardar el checklist
   */
  canSaveChecklist(): boolean {
    if (this.editingChecklist) {
      // Modo edición: solo necesita nombre
      return this.checklistName.trim().length > 0;
    } else {
      // Modo creación: nombre O checklist seleccionado (pero NO ambos)
      const hasName = this.checklistName.trim().length > 0;
      const hasSelection = this.selectedChecklistToCopy !== null;
      
      // XOR: Solo uno debe ser verdadero
      return (hasName && !hasSelection) || (!hasName && hasSelection);
    }
  }

  saveChecklist(): void {
    // ========================================
    // MODO EDICIÓN
    // ========================================
    if (this.editingChecklist && this.editingChecklist.id) {
      if (!this.checklistName.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Validación',
          text: 'El nombre del checklist es requerido',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        return;
      }

      const checklistData: Checklist = {
        name: this.checklistName.trim()
      };

      this.checklistsService.updateChecklist(this.tareaId, this.editingChecklist.id, checklistData).subscribe({
        next: (resp: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Checklist actualizado',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.checklistsChanged.emit();
          this.closeModal();
        },
        error: (error: any) => {
          console.error('❌ Error al actualizar checklist:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el checklist',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });

      return;
    }

    // ========================================
    // VALIDACIÓN: NO permitir nombre Y selección al mismo tiempo
    // ========================================
    const hasName = this.checklistName.trim().length > 0;
    const hasSelection = this.selectedChecklistToCopy !== null;

    if (hasName && hasSelection) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Solo puedes crear un checklist nuevo O copiar uno existente, no ambos. Por favor, borra el nombre o deselecciona el checklist.',
        timer: 4000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // ========================================
    // MODO COPIAR
    // ========================================
    if (this.selectedChecklistToCopy) {
      console.log('📋 Copiando checklist ID:', this.selectedChecklistToCopy);
      
      this.checklistsService.copyChecklist(this.tareaId, this.selectedChecklistToCopy).subscribe({
        next: (resp: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Checklist copiado',
            text: 'El checklist se copió exitosamente con todos sus elementos',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.checklistsChanged.emit();
          this.closeModal();
        },
        error: (error: any) => {
          console.error('❌ Error al copiar checklist:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo copiar el checklist',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      });

      return;
    }

    // ========================================
    // MODO CREAR DESDE CERO
    // ========================================
    if (!this.checklistName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre del checklist es requerido o selecciona uno para copiar',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const checklistData: Checklist = {
      name: this.checklistName.trim()
    };

    console.log('✨ Creando nuevo checklist:', checklistData);

    this.checklistsService.createChecklist(this.tareaId, checklistData).subscribe({
      next: (resp: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Checklist creado',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        this.checklistsChanged.emit();
        this.closeModal();
      },
      error: (error: any) => {
        console.error('❌ Error al crear checklist:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el checklist',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }
}