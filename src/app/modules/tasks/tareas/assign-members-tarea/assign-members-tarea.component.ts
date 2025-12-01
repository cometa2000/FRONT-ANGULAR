import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TareaService } from '../service/tarea.service';
import { GrupoService } from '../../grupos/service/grupo.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-assign-members-tarea',
  templateUrl: './assign-members-tarea.component.html',
  styleUrls: ['./assign-members-tarea.component.scss']
})
export class AssignMembersTareaComponent implements OnInit {
  @Input() TAREA_SELECTED: any;
  @Input() GRUPO_ID: number = 0;
  @Output() MembersAssigned: EventEmitter<any> = new EventEmitter();

  searchTerm: string = '';
  searchResults: any[] = [];
  selectedUsers: any[] = [];
  assignedMembers: any[] = [];
  isLoading: any;
  searchPerformed: boolean = false;
  defaultAvatar = 'assets/media/avatars/blank.png';

  private searchSubject = new Subject<string>();

  constructor(
    public modal: NgbActiveModal,
    private tareaService: TareaService,
    private grupoService: GrupoService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    // Debounce para la búsqueda (espera 500ms)
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
    console.log('🎯 Iniciando AssignMembersTareaComponent');
    console.log('📋 Tarea seleccionada:', this.TAREA_SELECTED);
    console.log('🏢 Grupo ID:', this.GRUPO_ID);

    this.isLoading = this.tareaService.isLoading$;
    this.loadAssignedMembers();
  }

  /**
   * Cargar miembros ya asignados a la tarea
   */
  loadAssignedMembers() {
    console.log('🔄 Cargando miembros asignados...');
    
    this.tareaService.getAssignedMembers(this.TAREA_SELECTED.id).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de miembros asignados:', resp);
        
        this.assignedMembers = resp.members || [];
        
        console.log('👥 Miembros asignados cargados:', this.assignedMembers.length);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar miembros asignados:', err);
        this.assignedMembers = [];
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Manejar cambios en el campo de búsqueda
   */
  onSearchChange() {
    this.searchPerformed = false;
    if (this.searchTerm.trim().length >= 3) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.searchResults = [];
    }
  }

  /**
   * Realizar búsqueda de usuarios
   */
  performSearch(term: string) {
    if (!term || term.trim().length < 3) {
      this.toast.warning('Ingresa al menos 3 caracteres para buscar', 'Búsqueda');
      return;
    }

    this.searchPerformed = true;
    console.log('🔍 Buscando miembro:', term);
    
    // Buscar en los miembros del grupo
    this.grupoService.getSharedUsers(this.GRUPO_ID).subscribe({
      next: (resp: any) => {
        console.log('📥 Respuesta del servidor:', resp);
        
        const allMembers = resp.shared_users || [];
        
        // Filtrar por el término de búsqueda
        this.searchResults = allMembers.filter((member: any) => {
          const fullName = `${member.name} ${member.surname || ''}`.toLowerCase();
          const email = (member.email || '').toLowerCase();
          const searchLower = term.toLowerCase();
          
          return fullName.includes(searchLower) || email.includes(searchLower);
        });
        
        this.cdr.detectChanges();
        
        console.log('👥 Miembros encontrados:', this.searchResults.length);
        
        if (this.searchResults.length === 0) {
          this.toast.info('No se encontraron miembros que coincidan', 'Búsqueda');
        } else {
          this.toast.success(`Se encontraron ${this.searchResults.length} miembro(s)`, 'Búsqueda');
        }
      },
      error: (err) => {
        console.error('❌ Error al buscar miembros:', err);
        this.toast.error('Error al buscar miembros', 'Error');
        this.searchResults = [];
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Verificar si el usuario ya está seleccionado
   */
  isUserSelected(userId: number): boolean {
    return this.selectedUsers.some(u => u.id === userId);
  }

  /**
   * Verificar si el usuario ya está asignado
   */
  isUserAlreadyAssigned(userId: number): boolean {
    return this.assignedMembers.some(m => m.id === userId);
  }

  /**
   * Seleccionar/Deseleccionar usuario
   */
  toggleUserSelection(user: any) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index === -1) {
      this.selectedUsers.push(user);
      this.toast.success(`${user.name} agregado`, 'Usuario seleccionado');
    } else {
      this.selectedUsers.splice(index, 1);
      this.toast.info(`${user.name} removido de la selección`, 'Usuario deseleccionado');
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Remover usuario de la selección
   */
  removeUser(userId: number) {
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== userId);
    this.cdr.detectChanges();
  }

  /**
   * Asignar miembros seleccionados a la tarea
   */
  assignMembers() {
    if (this.selectedUsers.length === 0) {
      this.toast.warning('Selecciona al menos un miembro', 'Validación');
      return;
    }

    const userIds = this.selectedUsers.map(u => u.id);
    console.log('📤 Asignando miembros:', userIds);

    this.tareaService.assignMembersToTarea(this.TAREA_SELECTED.id, userIds).subscribe({
      next: (resp: any) => {
        console.log('✅ Miembros asignados exitosamente:', resp);
        
        if (resp.message === 200) {
          this.toast.success('Miembros asignados correctamente', 'Éxito');
          
          // Agregar los nuevos miembros a la lista de asignados
          this.assignedMembers.push(...this.selectedUsers);
          
          // Limpiar selección
          this.selectedUsers = [];
          this.searchResults = [];
          this.searchTerm = '';
          
          // Emitir evento de actualización
          this.MembersAssigned.emit(resp.tarea || this.TAREA_SELECTED);
          
          this.cdr.detectChanges();
        } else {
          this.toast.warning(resp.message_text || 'Algo salió mal', 'Advertencia');
        }
      },
      error: (err) => {
        console.error('❌ Error al asignar miembros:', err);
        this.toast.error('Error al asignar miembros', 'Error');
      }
    });
  }

  /**
   * Desasignar un miembro de la tarea
   */
  unassignMember(userId: number) {
    const member = this.assignedMembers.find(m => m.id === userId);
    const memberName = member ? member.name : 'este miembro';

    if (confirm(`¿Estás seguro de desasignar a ${memberName} de esta tarea?`)) {
      console.log('🗑️ Desasignando miembro:', userId);
      
      this.tareaService.unassignMemberFromTarea(this.TAREA_SELECTED.id, userId).subscribe({
        next: (resp: any) => {
          if (resp.message === 200) {
            this.assignedMembers = this.assignedMembers.filter(m => m.id !== userId);
            this.toast.success('Miembro desasignado correctamente', 'Éxito');
            
            // Emitir evento de actualización
            this.MembersAssigned.emit(resp.tarea || this.TAREA_SELECTED);
            
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('❌ Error al desasignar miembro:', err);
          this.toast.error('Error al desasignar miembro', 'Error');
        }
      });
    }
  }

  /**
   * 🎨 Obtener la ruta correcta del avatar de un usuario
   */
  getUserAvatar(user: any): string {
    if (user?.avatar) {
      return this.getAvatarUrl(user.avatar);
    }
    return this.defaultAvatar;
  }

  /**
   * 🔧 Helper genérico para construir la URL del avatar
   * Maneja los formatos: "1.png", "2.png", URLs completas, y rutas storage
   */
  private getAvatarUrl(avatarValue: string): string {
    if (!avatarValue) {
      return this.defaultAvatar;
    }
    
    console.log('🔍 getAvatarUrl - Procesando avatar:', avatarValue);
    
    // Si ya es solo el nombre del archivo (ejemplo: "3.png")
    if (avatarValue.match(/^\d+\.png$/)) {
      const url = `assets/media/avatars/${avatarValue}`;
      console.log('✅ Formato nuevo detectado:', url);
      return url;
    }
    
    // Si contiene la ruta completa, usarla tal cual (retrocompatibilidad)
    if (avatarValue.includes('http') || avatarValue.includes('storage')) {
      console.log('✅ URL completa detectada:', avatarValue);
      return avatarValue;
    }
    
    // Si no coincide con ningún patrón, intentar construir la ruta
    const url = `assets/media/avatars/${avatarValue}`;
    console.log('✅ Construyendo ruta genérica:', url);
    return url;
  }

  /**
   * 🖼️ Manejo de error al cargar avatar
   */
  onAvatarError(event: any): void {
    console.error('❌ Error al cargar avatar, usando fallback');
    event.target.src = this.defaultAvatar;
  }
}