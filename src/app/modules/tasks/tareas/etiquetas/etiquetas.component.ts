import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EtiquetasService, Etiqueta } from '../service/etiquetas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-etiquetas',
  templateUrl: './etiquetas.component.html',
  styleUrls: ['./etiquetas.component.scss'],
})
export class EtiquetasComponent implements OnInit {
  @Input() tareaId?: number;
  @Output() etiquetasChanged = new EventEmitter<void>();

  etiquetas: Etiqueta[] = [];
  showModal: boolean = false;

  selectedColor: string = '#61BD4F';
  etiquetaName: string = '';
  editingEtiqueta: Etiqueta | null = null;

  // Tu HTML usa "availableColors" → añadimos alias de la lista
  colorOptions = [
    { name: 'Verde', value: '#61BD4F' },
    { name: 'Amarillo', value: '#F2D600' },
    { name: 'Naranja', value: '#FF9F1A' },
    { name: 'Rojo', value: '#EB5A46' },
    { name: 'Morado', value: '#C377E0' },
    { name: 'Azul', value: '#0079BF' },
    { name: 'Celeste', value: '#00C2E0' },
    { name: 'Lima', value: '#51E898' },
    { name: 'Rosa', value: '#FF78CB' },
    { name: 'Gris', value: '#B3BAC5' },
    { name: 'Negro', value: '#344563' }
  ];
  public availableColors = this.colorOptions;

  constructor(private etiquetasService: EtiquetasService) {}

  ngOnInit(): void {
    this.loadEtiquetas();
  }

  loadEtiquetas(): void {
    if (!this.tareaId) return;
    this.etiquetasService.getEtiquetas(this.tareaId!).subscribe({
      next: (resp: any) => {
        this.etiquetas = resp.etiquetas || [];
      },
      error: (error) => {
        console.error('Error al cargar etiquetas:', error);
      }
    });
  }

  // HTML usa (click)="selectColor(color.value)"
  selectColor(color: string): void {
    this.selectedColor = color;
  }

  // Método para abrir la modal (crear o editar)
  openModal(etiqueta?: Etiqueta): void {
    if (etiqueta) {
      // Modo edición
      this.editingEtiqueta = { ...etiqueta };
      this.selectedColor = etiqueta.color;
      this.etiquetaName = etiqueta.name;
    } else {
      // Modo creación
      this.editingEtiqueta = null;
      this.selectedColor = '#61BD4F';
      this.etiquetaName = '';
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEtiqueta = null;
    this.etiquetaName = '';
  }

  // HTML invoca saveEtiqueta() → crea o actualiza según el contexto
  saveEtiqueta(): void {
    if (this.editingEtiqueta) {
      this.updateEtiqueta();
    } else {
      this.createEtiqueta();
    }
  }

  // Crear
  createEtiqueta(): void {
    if (!this.tareaId) return;

    const name = (this.etiquetaName || '').trim();
    if (!name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la etiqueta es requerido',
        timer: 3000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      return;
    }

    const etiquetaData: Etiqueta = {
      id: 0 as any,
      name,
      color: this.selectedColor
    };

    this.etiquetasService.createEtiqueta(this.tareaId, etiquetaData).subscribe({
      next: () => {
        this.closeModal();
        this.loadEtiquetas();
        this.etiquetasChanged.emit();

        Swal.fire({
          icon: 'success',
          title: 'Etiqueta creada',
          timer: 1500,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al crear etiqueta:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la etiqueta',
          timer: 3500,
          toast: true,
          position: 'top-end',
          showConfirmButton: false
        });
      }
    });
  }


  // HTML usa editEtiqueta(etiqueta) → alias a openModal(etiqueta)
  editEtiqueta(etiqueta: Etiqueta): void {
    this.openModal(etiqueta);
  }

  // Actualizar
  updateEtiqueta(): void {
    if (!this.tareaId || !this.editingEtiqueta) return;

    const name = (this.etiquetaName || '').trim();
    if (!name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre de la etiqueta es requerido',
        timer: 3000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      return;
    }

    const etiquetaData: Etiqueta = {
      ...this.editingEtiqueta,
      name,
      color: this.selectedColor
    };

    this.etiquetasService.updateEtiqueta(this.tareaId, this.editingEtiqueta.id!, etiquetaData)
      .subscribe({
        next: () => {
          this.closeModal();
          this.loadEtiquetas();
          this.etiquetasChanged.emit();

          Swal.fire({
            icon: 'success',
            title: 'Etiqueta actualizada',
            timer: 1500,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al actualizar etiqueta:', error);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la etiqueta',
            timer: 3500,
            toast: true,
            position: 'top-end',
            showConfirmButton: false
          });
        }
      });
  }


  // Eliminar
  deleteEtiqueta(etiqueta: Etiqueta): void {
    // 🔥 Narrowing seguro
    if (typeof this.tareaId !== 'number') {
      console.error('❌ tareaId es undefined');
      return;
    }

    if (typeof etiqueta.id !== 'number') {
      console.error('❌ etiqueta.id es undefined');
      return;
    }

    // 🔥 Truco definitivo: copiar tareaId e id a constantes
    const tareaId = this.tareaId;
    const etiquetaId = etiqueta.id;

    // Ahora estos dos SIEMPRE son number ✔
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar etiqueta?',
      text: `¿Seguro que deseas eliminar "${etiqueta.name}"?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EB5A46',
      cancelButtonColor: '#B3BAC5'
    }).then(result => {

      if (result.isConfirmed) {

        this.etiquetasService.deleteEtiqueta(tareaId, etiquetaId).subscribe({
          next: () => {
            this.loadEtiquetas();
            this.etiquetasChanged.emit();

            Swal.fire({
              icon: 'success',
              title: 'Etiqueta eliminada',
              timer: 1500,
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          },

          error: (error) => {
            console.error('❌ Error al eliminar etiqueta:', error);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la etiqueta',
              toast: true,
              position: 'top-end',
              showConfirmButton: false
            });
          }
        });

      }

    });
  }

}