import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GrupoService } from '../service/grupo.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import Swal from 'sweetalert2';

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
    private cdr: ChangeDetectorRef  // ✅ NUEVO: Agregar ChangeDetectorRef
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
    console.log('🔄 Cargando usuarios compartidos...');
    
    // Cargar usuarios ya compartidos
    this.grupoService.getSharedUsers(this.GRUPO_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de usuarios compartidos:', resp);
        
        this.sharedUsers = resp.shared_users || [];
        
        console.log('👥 Usuarios compartidos cargados:', this.sharedUsers.length);
        console.log('📋 Datos:', this.sharedUsers);
        
        // ✅ CRÍTICO: Forzar detección de cambios
        this.cdr.detectChanges();
        
        console.log('✅ Vista actualizada con usuarios compartidos');
      },
      error: (err) => {
        console.error('❌ Error al cargar usuarios compartidos:', err);
        this.sharedUsers = [];
        this.cdr.detectChanges(); // ✅ También en error
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
      Swal.fire({
        icon: 'warning',
        title: 'Búsqueda',
        text: 'Ingresa al menos 3 caracteres para buscar',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    this.searchPerformed = true;
    console.log('🔍 Buscando usuario:', term);

    this.grupoService.searchUsers(term).subscribe({
      next: (resp: any) => {
        console.log('📥 Respuesta del servidor:', resp);

        if (!resp) {
          console.error('❌ Respuesta vacía del servidor');
          this.searchResults = [];

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Respuesta vacía del servidor',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          return;
        }

        this.searchResults = resp.users || resp.data || [];
        this.cdr.detectChanges();

        console.log('👥 Usuarios encontrados:', this.searchResults.length);

        if (this.searchResults.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Búsqueda',
            text: 'No se encontraron usuarios',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Búsqueda',
            text: `Se encontraron ${this.searchResults.length} usuario(s)`,
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      },

      error: (err) => {
        console.error('❌ Error al buscar usuarios:', err);
        this.searchResults = [];
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al buscar usuarios. Revisa la consola.',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
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

      Swal.fire({
        icon: 'success',
        title: 'Usuario seleccionado',
        text: `${user.name} agregado`,
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

    } else {
      this.selectedUsers.splice(index, 1);

      Swal.fire({
        icon: 'info',
        title: 'Usuario deseleccionado',
        text: `${user.name} removido de la selección`,
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }

    this.cdr.detectChanges();
  }


  removeUser(userId: number) {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== userId);
    
    // ✅ NUEVO: Forzar detección al remover
    this.cdr.detectChanges();
  }

  unshareUser(userId: number) {

    Swal.fire({
      icon: 'warning',
      title: '¿Dejar de compartir?',
      text: '¿Estás seguro de dejar de compartir este grupo con este usuario?',
      showCancelButton: true,
      confirmButtonText: 'Sí, dejar de compartir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {
        console.log('🗑️ Eliminando usuario compartido:', userId);

        this.grupoService.unshareGrupo(this.GRUPO_SELECTED.id, userId).subscribe({
          next: (resp: any) => {
            if (resp.message === 200) {

              this.sharedUsers = this.sharedUsers.filter(u => u.id !== userId);
              this.cdr.detectChanges();

              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Grupo dejado de compartir correctamente',
                timer: 3500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
              });

              this.GrupoShared.emit(this.sharedUsers);
            }
          },
          error: (err) => {
            console.error('❌ Error al dejar de compartir:', err);

            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al dejar de compartir el grupo',
              timer: 3500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        });

      }

    });
  }


  shareGrupo() {
    if (this.selectedUsers.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Selecciona al menos un usuario',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    const userIds = this.selectedUsers.map(u => u.id);
    console.log('📤 Compartiendo grupo con usuarios:', userIds);

    this.grupoService.shareGrupo(this.GRUPO_SELECTED.id, userIds).subscribe({
      next: (resp: any) => {
        if (resp.message === 200) {

          Swal.fire({
            icon: 'success',
            title: 'Grupo compartido',
            text: `Grupo compartido con ${this.selectedUsers.length} usuario(s)`,
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.sharedUsers = [...this.sharedUsers, ...this.selectedUsers];
          this.selectedUsers = [];
          this.searchResults = [];
          this.searchTerm = '';

          this.cdr.detectChanges();
          this.GrupoShared.emit(resp.shared_with);

          setTimeout(() => {
            this.modal.close();
          }, 1500);
        }
      },

      error: (err) => {
        console.error('❌ Error al compartir grupo:', err);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al compartir el grupo',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });
  }


  /**
   * Obtener avatar correcto del usuario compartido
   */
  getSharedAvatar(user: any): string {
    if (user?.avatar) {
      return this.resolveAvatarPath(user.avatar);
    }
    return 'assets/media/avatars/1.png';
  }

  /**
   * Resolver ruta del avatar según formato:
   * - 1.png → assets/media/avatars/1.png
   * - url completa → se usa tal cual
   * - storage/... → se usa tal cual
   */
  resolveAvatarPath(avatar: string): string {
    if (!avatar) {
      return 'assets/media/avatars/1.png';
    }

    // Si es "1.png", "23.jpg", etc.
    if (avatar.match(/^\w+\.(png|jpg|jpeg|gif)$/i)) {
      return `assets/media/avatars/${avatar}`;
    }

    // Si ya contiene una URL completa
    if (avatar.includes('http') || avatar.includes('storage')) {
      return avatar;
    }

    // Ruta fallback
    return `assets/media/avatars/${avatar}`;
  }

}