import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-share-grupo',
  templateUrl: './share-grupo.component.html',
  styleUrls: ['./share-grupo.component.scss']
})
export class ShareGrupoComponent implements OnInit {
  @Input() GRUPO_SELECTED: any;
  @Output() GrupoShared: EventEmitter<any> = new EventEmitter();

  searchTerm: string = '';
  searchResults: any[] = [];
  selectedUsers: any[] = [];
  sharedUsers: any[] = [];
  isLoading: any;
  searchPerformed: boolean = false;

  private searchSubject = new Subject<string>();

  constructor(
    public modal: NgbActiveModal,
    private grupoService: GrupoService,
    private toast: ToastrService,
  ) {
    // Debounce para la búsqueda (espera 500ms después de que el usuario deje de escribir)
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        if (searchTerm.trim().length >= 3) {
          this.performSearch(searchTerm);
        }
      });
  }

  ngOnInit(): void {
    this.isLoading = this.grupoService.isLoading$;
    this.loadSharedUsers();
  }

  loadSharedUsers() {
    // Cargar usuarios ya compartidos
    this.grupoService.getSharedUsers(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        this.sharedUsers = resp.shared_users || [];
      },
      error: (err) => {
        console.error('Error al cargar usuarios compartidos:', err);
      }
    });
  }

  onSearchChange() {
    this.searchPerformed = false;
    if (this.searchTerm.trim().length >= 3) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.searchResults = [];
    }
  }

  performSearch(term: string) {
    if (!term || term.trim().length < 3) {
      this.toast.warning('Ingresa al menos 3 caracteres para buscar', 'Búsqueda');
      return;
    }

    this.searchPerformed = true;
    console.log('🔍 Buscando usuario:', term);
    
    this.grupoService.searchUsers(term).subscribe({
      next: (resp: any) => {
        console.log('📥 Respuesta del servidor:', resp);
        
        // Manejar diferentes estructuras de respuesta
        if (!resp) {
          console.error('❌ Respuesta vacía del servidor');
          this.searchResults = [];
          this.toast.error('Error: respuesta vacía del servidor', 'Error');
          return;
        }
        
        // Intentar obtener users de diferentes formas
        this.searchResults = resp.users || resp.data || [];
        
        console.log('👥 Usuarios encontrados:', this.searchResults.length);
        
        if (this.searchResults.length === 0) {
          this.toast.info('No se encontraron usuarios', 'Búsqueda');
        } else {
          this.toast.success(`Se encontraron ${this.searchResults.length} usuario(s)`, 'Búsqueda');
        }
      },
      error: (err) => {
        console.error('❌ Error al buscar usuarios:', err);
        console.error('Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        
        this.toast.error('Error al buscar usuarios. Revisa la consola.', 'Error');
        this.searchResults = [];
      }
    });
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.some(u => u.id === userId);
  }

  isUserAlreadyShared(userId: number): boolean {
    return this.sharedUsers.some(u => u.id === userId);
  }

  toggleUserSelection(user: any) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index === -1) {
      this.selectedUsers.push(user);
      this.toast.success(`${user.name} agregado`, 'Usuario seleccionado');
    } else {
      this.selectedUsers.splice(index, 1);
      this.toast.info(`${user.name} removido de la selección`, 'Usuario deseleccionado');
    }
  }

  removeUser(userId: number) {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== userId);
  }

  unshareUser(userId: number) {
    if (confirm('¿Estás seguro de dejar de compartir este grupo con este usuario?')) {
      this.grupoService.unshareGrupo(this.GRUPO_SELECTED.id, userId).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.sharedUsers = this.sharedUsers.filter(u => u.id !== userId);
            this.toast.success('Grupo dejado de compartir correctamente', 'Éxito');
            this.GrupoShared.emit(this.sharedUsers);
          }
        },
        error: (err) => {
          console.error('Error al dejar de compartir:', err);
          this.toast.error('Error al dejar de compartir el grupo', 'Error');
        }
      });
    }
  }

  shareGrupo() {
    if (this.selectedUsers.length === 0) {
      this.toast.warning('Selecciona al menos un usuario', 'Validación');
      return;
    }

    const userIds = this.selectedUsers.map(u => u.id);

    this.grupoService.shareGrupo(this.GRUPO_SELECTED.id, userIds).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {
          this.toast.success(
            `Grupo compartido con ${this.selectedUsers.length} usuario(s)`, 
            'Éxito'
          );
          
          // Mover usuarios de selectedUsers a sharedUsers
          this.sharedUsers = [...this.sharedUsers, ...this.selectedUsers];
          this.selectedUsers = [];
          this.searchResults = [];
          this.searchTerm = '';
          
          this.GrupoShared.emit(resp.shared_with);
          
          // Cerrar modal después de compartir exitosamente
          setTimeout(() => {
            this.modal.close();
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Error al compartir grupo:', err);
        this.toast.error('Error al compartir el grupo', 'Error');
      }
    });
  }
}