import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../service/users.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent {

  @Output() UserE: EventEmitter<any> = new EventEmitter();
  @Input() roles:any = [];
  @Input() USER_SELECTED:any;
  @Input() sucursales:any = [];

  isLoading:any;
  
  name:string = '';
  surname:string = '';
  email:string = '';
  phone:string = '';
  role_id:string = '';
  gender:string = '';
  type_document:string = 'DNI';
  n_document:string = '';
  address:string = '';

  password:string = '';
  password_repit:string = '';
  sucursale_id:string = '';

  // ✅ NUEVAS PROPIEDADES PARA AVATARES PREDEFINIDOS
  selectedAvatar: string = '1.png'; // Avatar por defecto
  availableAvatars: string[] = [
    '1.png', '2.png', '3.png', '4.png', '5.png',
    '6.png', '7.png', '8.png', '9.png', '10.png'
  ];
  
  constructor(
    public modal: NgbActiveModal,
    public usersService: UsersService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    // Cargar datos del usuario seleccionado
    this.name = this.USER_SELECTED.name;
    this.surname = this.USER_SELECTED.surname;
    this.email = this.USER_SELECTED.email;
    this.phone = this.USER_SELECTED.phone;
    this.role_id = this.USER_SELECTED.role_id;
    this.gender = this.USER_SELECTED.gender;
    this.type_document = this.USER_SELECTED.type_document;
    this.n_document = this.USER_SELECTED.n_document;
    this.address = this.USER_SELECTED.address;
    this.sucursale_id = this.USER_SELECTED.sucursale_id;

    // ✅ NUEVO: Cargar el avatar actual del usuario
    // Si el avatar contiene "storage" o "http", extraer solo el nombre del archivo
    if (this.USER_SELECTED.avatar) {
      const avatarUrl = this.USER_SELECTED.avatar;
      
      // Si es una URL completa, intentar extraer el nombre del archivo
      if (avatarUrl.includes('avatars/')) {
        const match = avatarUrl.match(/avatars\/(\d+\.png)/);
        if (match && match[1]) {
          this.selectedAvatar = match[1];
        }
      } 
      // Si ya es solo el nombre del archivo (ejemplo: "3.png")
      else if (avatarUrl.match(/^\d+\.png$/)) {
        this.selectedAvatar = avatarUrl;
      }
      // Si no coincide con ningún patrón, usar avatar por defecto
      else {
        this.selectedAvatar = '1.png';
      }
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

  store() {

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

    // --- Validación de documento ---
    if (!this.type_document || !this.n_document) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Debes ingresar el tipo y número de documento',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- ✅ Validación de teléfono (exactamente 10 dígitos) ---
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

    // --- Validación de género ---
    if (!this.gender) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El género es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación de rol ---
    if (!this.role_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El rol es requerido',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación de contraseñas ---
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
    formData.append("phone", this.phone);
    formData.append("role_id", this.role_id);
    formData.append("gender", this.gender);
    formData.append("type_document", this.type_document);
    formData.append("n_document", this.n_document);

    if (this.address) formData.append("address", this.address);
    if (this.password) formData.append("password", this.password);

    formData.append("sucursale_id", this.sucursale_id);

    // ✅ NUEVO: Enviar el avatar seleccionado en lugar de un archivo
    formData.append("avatar", this.selectedAvatar);

    // --- Llamada al servicio ---
    this.usersService.updateUser(this.USER_SELECTED.id, formData).subscribe({

      next: (resp: any) => {

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
        } else {

          Swal.fire({
            icon: 'success',
            title: 'Usuario actualizado',
            text: 'La información del usuario fue editada correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.UserE.emit(resp.user);
          this.modal.close();
        }

      },

      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el usuario',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }

    });

  }

}