import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VistaDocumentoService } from '../../vista-documentos/service/vista-documento.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-move-documento',
  templateUrl: './move-documento.component.html',
  styleUrls: ['./move-documento.component.scss']
})
export class MoveDocumentoComponent implements OnInit {
  @Input() DOCUMENTO_SELECTED: any;
  @Input() sucursale_id!: number;
  @Input() current_parent_id: number | null = null;
  
  @Output() DocumentoMoved = new EventEmitter<any>();

  folderTree: any[] = [];
  selectedDestination: number | null | undefined = undefined;
  
  isLoading: boolean = false;
  isMoving: boolean = false;

  // Para evitar mover una carpeta dentro de sí misma o sus descendientes
  private descendantIds: number[] = [];

  constructor(
    public modal: NgbActiveModal,
    private vistaDocumentoService: VistaDocumentoService
  ) {}

  ngOnInit(): void {
    this.loadFolderTree();
    this.calculateDescendants();
  }

  /**
   * Cargar árbol de carpetas
   */
  loadFolderTree() {
    this.isLoading = true;
    
    this.vistaDocumentoService.getFolderTree(this.sucursale_id).subscribe({
      next: (resp: any) => {
        this.folderTree = resp.folders || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading folder tree:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el árbol de carpetas'
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Calcular IDs de descendientes (para carpetas)
   */
  private calculateDescendants() {
    if (this.DOCUMENTO_SELECTED?.type !== 'folder') return;

    this.descendantIds = [this.DOCUMENTO_SELECTED.id];
    this.collectDescendants(this.folderTree);
  }

  /**
   * Recolectar IDs de todas las subcarpetas recursivamente
   */
  private collectDescendants(folders: any[]) {
    folders.forEach(folder => {
      if (this.isDescendantOf(folder, this.DOCUMENTO_SELECTED.id)) {
        this.descendantIds.push(folder.id);
        if (folder.children && folder.children.length > 0) {
          this.collectDescendants(folder.children);
        }
      }
    });
  }

  /**
   * Verificar si una carpeta es descendiente de otra
   */
  private isDescendantOf(folder: any, parentId: number): boolean {
    if (folder.parent_id === parentId) return true;
    
    // Buscar recursivamente en el árbol
    for (const f of this.folderTree) {
      if (this.checkParentRecursive(f, folder.id, parentId)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Verificar recursivamente si hay relación padre-hijo
   */
  private checkParentRecursive(current: any, targetId: number, searchParentId: number): boolean {
    if (current.id === targetId && current.parent_id === searchParentId) {
      return true;
    }

    if (current.children && current.children.length > 0) {
      for (const child of current.children) {
        if (this.checkParentRecursive(child, targetId, searchParentId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Verificar si un ID es descendiente del documento seleccionado
   */
  isDescendant(folderId: number): boolean {
    return this.descendantIds.includes(folderId);
  }

  /**
   * Mover documento/carpeta
   */
  moveDocument() {
    // Validar que se haya seleccionado un destino
    if (this.selectedDestination === undefined) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un destino',
        text: 'Debes seleccionar dónde mover este elemento'
      });
      return;
    }

    // Verificar que no sea el mismo lugar
    if (this.selectedDestination === this.current_parent_id) {
      Swal.fire({
        icon: 'info',
        title: 'Misma ubicación',
        text: 'El elemento ya está en esa ubicación'
      });
      return;
    }

    this.isMoving = true;

    const data = {
      parent_id: this.selectedDestination
    };

    this.vistaDocumentoService.moveDocument(this.DOCUMENTO_SELECTED.id, data).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          // Asegurar que selectedDestination no sea undefined antes de pasar
          const destination: number | null = this.selectedDestination === undefined ? null : this.selectedDestination;
          const destName = this.getDestinationName(destination);
          
          Swal.fire({
            icon: 'success',
            title: 'Movido exitosamente',
            text: `"${this.DOCUMENTO_SELECTED.name}" ha sido movido a ${destName}`,
            timer: 2500,
            showConfirmButton: false
          });

          this.DocumentoMoved.emit(resp.documento);
          this.modal.close();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.message_text || 'No se pudo mover el elemento'
          });
        }
        this.isMoving = false;
      },
      error: (err) => {
        console.error('Error moving document:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message_text || 'Error al mover el elemento'
        });
        this.isMoving = false;
      }
    });
  }

  /**
   * Obtener nombre del destino
   */
  private getDestinationName(destinationId: number | null): string {
    if (destinationId === null) {
      return 'Raíz';
    }

    const folder = this.findFolderById(this.folderTree, destinationId);
    return folder ? folder.name : 'carpeta seleccionada';
  }

  /**
   * Buscar carpeta por ID recursivamente
   */
  private findFolderById(folders: any[], id: number): any {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      
      if (folder.children && folder.children.length > 0) {
        const found = this.findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  }
}