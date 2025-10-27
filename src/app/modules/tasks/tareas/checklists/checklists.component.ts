import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChecklistsService, Checklist, ChecklistItem } from '../service/checklists.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checklists',
  templateUrl: './checklists.component.html',
  styleUrls: ['./checklists.component.scss']
})
export class ChecklistsComponent implements OnInit {
  @Input() tareaId!: number;
  @Output() checklistsChanged = new EventEmitter<void>();

  checklists: Checklist[] = [];
  showModal = false;
  checklistName = '';
  editingChecklist: Checklist | null = null;
  newItemNames: { [key: number]: string } = {};

  constructor(
    private checklistsService: ChecklistsService
  ) {}

  ngOnInit(): void {
    if (this.tareaId) {
      this.loadChecklists();
    }
  }

  loadChecklists(): void {
    this.checklistsService.getChecklists(this.tareaId).subscribe({
      next: (resp: any) => {
        console.log('✅ Checklists cargados:', resp);
        this.checklists = resp.checklists || [];
        this.calculateProgress();
      },
      error: (error) => {
        console.error('❌ Error al cargar checklists:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los checklists'
        });
      }
    });
  }

  calculateProgress(): void {
    this.checklists.forEach(checklist => {
      if (checklist.items && checklist.items.length > 0) {
        const completed = checklist.items.filter(item => item.completed).length;
        checklist.progress = Math.round((completed / checklist.items.length) * 100);
      } else {
        checklist.progress = 0;
      }
    });
  }

  getCompletedCount(checklist: Checklist): number {
    if (!checklist.items) return 0;
    return checklist.items.filter(item => item.completed).length;
  }

  getProgressClass(progress: number): string {
    if (progress === 100) return 'progress-complete';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  }

  openModal(checklist?: Checklist): void {
    if (checklist) {
      this.editingChecklist = checklist;
      this.checklistName = checklist.name;
    } else {
      this.editingChecklist = null;
      this.checklistName = '';
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.checklistName = '';
    this.editingChecklist = null;
  }

  saveChecklist(): void {
    if (!this.checklistName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'El nombre del checklist es requerido'
      });
      return;
    }

    const checklistData: Checklist = {
      name: this.checklistName.trim()
    };

    if (this.editingChecklist && this.editingChecklist.id) {
      // Actualizar checklist existente
      this.checklistsService.updateChecklist(this.tareaId, this.editingChecklist.id, checklistData).subscribe({
        next: (resp: any) => {
          console.log('✅ Checklist actualizado:', resp);
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Checklist actualizado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.loadChecklists();
          this.checklistsChanged.emit();
          this.closeModal();
        },
        error: (error) => {
          console.error('❌ Error al actualizar checklist:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el checklist'
          });
        }
      });
    } else {
      // Crear nuevo checklist
      this.checklistsService.createChecklist(this.tareaId, checklistData).subscribe({
        next: (resp: any) => {
          console.log('✅ Checklist creado:', resp);
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Checklist creado correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          this.loadChecklists();
          this.checklistsChanged.emit();
          this.closeModal();
        },
        error: (error) => {
          console.error('❌ Error al crear checklist:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el checklist'
          });
        }
      });
    }
  }

  deleteChecklist(checklist: Checklist): void {
    if (!checklist.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el checklist "${checklist.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && checklist.id) {
        this.checklistsService.deleteChecklist(this.tareaId, checklist.id).subscribe({
          next: (resp: any) => {
            console.log('✅ Checklist eliminado:', resp);
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Checklist eliminado correctamente',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadChecklists();
            this.checklistsChanged.emit();
          },
          error: (error) => {
            console.error('❌ Error al eliminar checklist:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el checklist'
            });
          }
        });
      }
    });
  }

  addItem(checklist: Checklist, event?: Event): void {
    if (!checklist.id) return;

    const itemName = this.newItemNames[checklist.id];
    if (!itemName || !itemName.trim()) {
      return;
    }

    const itemData: ChecklistItem = {
      name: itemName.trim(),
      completed: false
    };

    this.checklistsService.addItem(this.tareaId, checklist.id, itemData).subscribe({
      next: (resp: any) => {
        console.log('✅ Item añadido:', resp);
        this.newItemNames[checklist.id!] = ''; // Limpiar el input
        this.loadChecklists();
        this.checklistsChanged.emit();
      },
      error: (error) => {
        console.error('❌ Error al añadir item:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo añadir el item'
        });
      }
    });
  }

  toggleItem(checklist: Checklist, item: ChecklistItem): void {
    if (!checklist.id || !item.id) return;

    const updatedItem: Partial<ChecklistItem> = {
      completed: !item.completed
    };

    this.checklistsService.updateItem(this.tareaId, checklist.id, item.id, updatedItem).subscribe({
      next: (resp: any) => {
        console.log('✅ Item actualizado:', resp);
        this.loadChecklists();
        this.checklistsChanged.emit();
      },
      error: (error) => {
        console.error('❌ Error al actualizar item:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el item'
        });
      }
    });
  }

  deleteItem(checklist: Checklist, item: ChecklistItem): void {
    if (!checklist.id || !item.id) return;

    Swal.fire({
      title: '¿Eliminar este paso?',
      text: `Se eliminará "${item.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && checklist.id && item.id) {
        this.checklistsService.deleteItem(this.tareaId, checklist.id, item.id).subscribe({
          next: (resp: any) => {
            console.log('✅ Item eliminado:', resp);
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Paso eliminado correctamente',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadChecklists();
            this.checklistsChanged.emit();
          },
          error: (error) => {
            console.error('❌ Error al eliminar item:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el paso'
            });
          }
        });
      }
    });
  }
}
