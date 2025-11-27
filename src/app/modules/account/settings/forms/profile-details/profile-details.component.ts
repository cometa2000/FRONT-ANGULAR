import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileService } from '../../../service/profile.service';

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent implements OnInit, OnDestroy {
  
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean = false;
  
  currentUser: any = null;
  roles: any[] = [];
  sucursales: any[] = [];
  
  // Campos del formulario
  name: string = '';
  surname: string = '';
  email: string = '';
  phone: string = '';
  role_id: any = ''; // ⭐ CAMBIADO: Usar any para aceptar números y strings
  gender: string = '';
  type_document: string = 'DNI';
  n_document: string = '';
  sucursale_id: any = ''; // ⭐ CAMBIADO: Usar any para aceptar números y strings
  
  // ✅ NUEVAS PROPIEDADES PARA AVATARES PREDEFINIDOS
  selectedAvatar: string = '1.png'; // Avatar por defecto
  availableAvatars: string[] = [
    '1.png', '2.png', '3.png', '4.png', '5.png',
    '6.png', '7.png', '8.png', '9.png', '10.png'
  ];
  
  // Para cambio de contraseña (opcional)
  password: string = '';
  password_repit: string = '';
  
  private unsubscribe: Subscription[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService
  ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  ngOnInit(): void {
    console.log('🔄 ProfileDetailsComponent inicializado');
    this.loadConfig(); // ⭐ PRIMERO: Cargar roles y sucursales
    this.loadUserData(); // SEGUNDO: Cargar datos del usuario
  }

  /**
   * Cargar configuración (roles y sucursales)
   */
  loadConfig(): void {
    console.log('📡 Cargando configuración (roles y sucursales)...');
    
    this.profileService.getConfig().subscribe({
      next: (resp: any) => {
        console.log('✅ Configuración cargada:', resp);
        this.roles = resp.roles || [];
        this.sucursales = resp.sucursales || [];
        
        console.log('📋 Roles disponibles:', this.roles);
        console.log('🏢 Sucursales disponibles:', this.sucursales);
        
        // ⭐ IMPORTANTE: Detectar cambios después de cargar
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar configuración:', error);
      }
    });
  }

  /**
   * Cargar los datos del usuario
   */
  loadUserData(): void {
    console.log('📡 Cargando datos del usuario...');
    
    const userSub = this.profileService.currentUser$.subscribe({
      next: (user) => {
        console.log('👤 Usuario recibido en ProfileDetailsComponent:', user);
        
        if (user) {
          this.currentUser = user;
          this.initializeFormFields();
        } else {
          console.log('⚠️ Usuario no disponible, cargando desde servidor...');
          // Si no hay usuario, cargar desde servidor
          this.profileService.getProfile().subscribe({
            next: (resp: any) => {
              console.log('✅ Usuario cargado desde servidor:', resp);
              this.currentUser = resp;
              this.profileService.setCurrentUser(resp);
              this.initializeFormFields();
            },
            error: (error) => {
              console.error('❌ Error al cargar usuario:', error);
            }
          });
        }
      }
    });
    
    this.unsubscribe.push(userSub);
  }

  /**
   * Inicializar los campos del formulario con los datos del usuario
   */
  initializeFormFields(): void {
    if (this.currentUser) {
      console.log('📝 Inicializando campos del formulario con:', this.currentUser);
      
      this.name = this.currentUser.name || '';
      this.surname = this.currentUser.surname || '';
      this.email = this.currentUser.email || '';
      this.phone = this.currentUser.phone || '';
      
      // ⭐ IMPORTANTE: Convertir a string para el binding con select
      this.role_id = this.currentUser.role_id ? String(this.currentUser.role_id) : '';
      this.sucursale_id = this.currentUser.sucursale_id ? String(this.currentUser.sucursale_id) : '';
      
      this.gender = this.currentUser.gender || '';
      this.type_document = this.currentUser.type_document || 'DNI';
      this.n_document = this.currentUser.n_document || '';
      
      // ✅ NUEVO: Cargar el avatar actual del usuario
      if (this.currentUser.avatar) {
        const avatarValue = this.currentUser.avatar;
        
        // Si ya es solo el nombre del archivo (ejemplo: "3.png")
        if (avatarValue.match(/^\d+\.png$/)) {
          this.selectedAvatar = avatarValue;
        }
        // Si contiene la ruta completa, extraer el nombre
        else if (avatarValue.includes('avatars/')) {
          const match = avatarValue.match(/avatars\/(\d+\.png)/);
          if (match && match[1]) {
            this.selectedAvatar = match[1];
          }
        }
        // Si no coincide, usar avatar por defecto
        else {
          this.selectedAvatar = '1.png';
        }
      }
      
      console.log('✅ Campos inicializados:');
      console.log('   - role_id:', this.role_id);
      console.log('   - sucursale_id:', this.sucursale_id);
      console.log('   - selectedAvatar:', this.selectedAvatar);
      console.log('   - gender:', this.gender);
      
      // ⭐ IMPORTANTE: Detectar cambios
      this.cdr.detectChanges();
    }
  }

  /**
   * ✅ NUEVO: Método para obtener la ruta completa del avatar
   */
  getAvatarPath(avatarName: string): string {
    return `assets/media/avatars/${avatarName}`;
  }

  /**
   * ✅ NUEVO: Método para seleccionar un avatar
   */
  selectAvatar(avatarName: string): void {
    this.selectedAvatar = avatarName;
    console.log('🎨 Avatar seleccionado:', avatarName);
  }

  /**
   * ✅ NUEVO: Método para permitir solo números en el input de teléfono
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Solo permite números (0-9)
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  /**
   * ✅ NUEVO: Método para validar pegado de texto en el campo de teléfono
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Solo permitir números
    const numericValue = pastedText.replace(/[^0-9]/g, '').substring(0, 10);
    this.phone = numericValue;
  }

  /**
   * Guardar los cambios del perfil
   */
  saveSettings(): void {
    console.log('💾 Iniciando guardado de perfil...');
    
    // --- Validación de nombre ---
    if (!this.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El nombre es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación de apellido ---
    if (!this.surname) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El apellido es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación de correo ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico válido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación de teléfono (opcional pero si se ingresa debe ser válido) ---
    if (this.phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(this.phone)) {
        Swal.fire({
          icon: 'warning',
          title: 'Teléfono inválido',
          text: 'El número de teléfono debe contener exactamente 10 dígitos',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        return;
      }
    }

    // --- Validación de contraseñas (solo si se ingresó una nueva contraseña) ---
    if (this.password && this.password !== this.password_repit) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Las contraseñas no coinciden',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Construcción de FormData ---
    let formData = new FormData();
    formData.append("name", this.name);
    formData.append("surname", this.surname);
    formData.append("email", this.email);
    
    if (this.phone) formData.append("phone", this.phone);
    if (this.role_id) formData.append("role_id", this.role_id);
    if (this.gender) formData.append("gender", this.gender);
    if (this.type_document) formData.append("type_document", this.type_document);
    if (this.n_document) formData.append("n_document", this.n_document);
    if (this.sucursale_id) formData.append("sucursale_id", this.sucursale_id);
    if (this.password) formData.append("password", this.password);
    
    // ✅ NUEVO: Enviar el avatar seleccionado en lugar de un archivo
    formData.append("avatar", this.selectedAvatar);

    console.log('📦 FormData preparado para enviar');

    // --- Llamada al servicio ---
    this.isLoading$.next(true);
    
    this.profileService.updateProfile(formData).subscribe({
      next: (resp: any) => {
        console.log('✅ Respuesta de actualización:', resp);
        
        if (resp.message == 403) {
          Swal.fire({
            icon: 'error',
            title: 'Validación',
            text: resp.message_text,
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          this.isLoading$.next(false);
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Perfil actualizado',
            text: 'Tu información personal ha sido actualizada correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          // ⭐ IMPORTANTE: Actualizar el usuario en el servicio
          this.profileService.setCurrentUser(resp.user);
          
          // Reinicializar campos con los nuevos datos
          this.currentUser = resp.user;
          this.initializeFormFields();
          
          // Limpiar las contraseñas por seguridad
          this.password = '';
          this.password_repit = '';
          
          this.isLoading$.next(false);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar perfil:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        this.isLoading$.next(false);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('🔚 ProfileDetailsComponent destruido');
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}