import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from '../service/users.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {

  @Output() UserC: EventEmitter<any> = new EventEmitter();
  @Input() roles:any = [];
  @Input() sucursales:any = [];

  // ✅ Observable para controlar el estado de carga del botón
  isLoading:any;
  
  name:string = '';
  surname:string = '';
  email:string = '';
  phone:string = '';
  role_id:string = '';
  gender:string = '';
  type_document:string = '';
  n_document:string = '';
  address:string = '';
  sucursale_id:string = '';

  // ✅ PROPIEDADES PARA AVATARES PREDEFINIDOS
  selectedAvatar: string = '1.png'; // Avatar por defecto
  availableAvatars: string[] = [
    '1.png', '2.png', '3.png', '4.png', '5.png',
    '6.png', '7.png', '8.png', '9.png', '10.png'
  ];
  
  constructor(
    public modal: NgbActiveModal,
    public usersService: UsersService,
    public toast: ToastrService,
    private modalService: NgbModal
  ) {
    
  }

  ngOnInit(): void {
    // ✅ Suscribirse al observable de carga del servicio
    this.isLoading = this.usersService.isLoading$;
  }
  
  /**
   * ✅ Método para obtener la ruta completa del avatar
   */
  getAvatarPath(avatarName: string): string {
    return `assets/media/avatars/${avatarName}`;
  }

  /**
   * ✅ Método para seleccionar un avatar
   */
  selectAvatar(avatarName: string): void {
    this.selectedAvatar = avatarName;
  }

  /**
   * ✅ Método para permitir solo números en el input de teléfono
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
   * ✅ Método para validar pegado de texto en el campo de teléfono
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    // Solo permitir números
    const numericValue = pastedText.replace(/[^0-9]/g, '').substring(0, 10);
    this.phone = numericValue;
  }
  
  /**
   * ✅ Método principal para registrar un nuevo usuario
   * ⚡ El estado de carga se maneja automáticamente en el servicio
   */
  store() {

    // --- Validación: nombre ---
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

    // --- Validación: apellido ---
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

    // --- Validación: tipo y número de documento ---
    if (!this.type_document || !this.n_document) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'El tipo y número de documento son obligatorios',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación: correo electrónico ---
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

    // --- ✅ Validación: teléfono (exactamente 10 dígitos) ---
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

    // --- Validación: género ---
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

    // --- Validación: rol ---
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

    // --- Validación: sucursal ---
    if (!this.sucursale_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'La sucursal es requerida',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- ✅ Validación: avatar debe estar seleccionado ---
    if (!this.selectedAvatar) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Debes seleccionar un avatar',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación específica según el tipo de documento ---
    if (this.type_document === 'RFC') {
      const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(this.n_document.toUpperCase())) {
        Swal.fire({
          icon: 'warning',
          title: 'RFC inválido',
          text: 'Ingresa un RFC válido',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        return;
      }
    }

    if (this.type_document === 'CURP') {
      const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
      if (!curpRegex.test(this.n_document.toUpperCase())) {
        Swal.fire({
          icon: 'warning',
          title: 'CURP inválida',
          text: 'Ingresa una CURP válida',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        return;
      }
    }

    if (this.type_document === 'PASAPORTE') {
      const passportRegex = /^[A-Z]{1}[0-9]{8}$/;
      if (!passportRegex.test(this.n_document.toUpperCase())) {
        Swal.fire({
          icon: 'warning',
          title: 'Pasaporte inválido',
          text: 'Ingresa un número de pasaporte válido',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        return;
      }
    }


    // ----------------------------------------------------
    // Construcción del formulario
    // ----------------------------------------------------
    let formData = new FormData();
    formData.append("name", this.name);
    formData.append("surname", this.surname);
    formData.append("email", this.email);
    formData.append("phone", this.phone);
    formData.append("role_id", this.role_id);
    formData.append("gender", this.gender);
    formData.append("type_document", this.type_document);
    formData.append("n_document", this.n_document);

    if (this.address) {
      formData.append("address", this.address);
    }

    formData.append("sucursale_id", this.sucursale_id);
    
    // ✅ Enviar el avatar seleccionado
    formData.append("avatar", this.selectedAvatar);

    // ----------------------------------------------------
    // ⚡ Llamada al servicio
    // ⚡ El isLoadingSubject.next(true) se activa automáticamente en el servicio
    // ⚡ El botón se deshabilitará y mostrará "Cargando..." automáticamente
    // ----------------------------------------------------
    this.usersService.registerUser(formData).subscribe({

      next: (resp: any) => {
        // ⚡ El isLoadingSubject.next(false) se activa automáticamente al finalizar

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

          // ✅ MOSTRAR MODAL CON EMAIL Y CONTRASEÑA GENERADA
          this.showPasswordModal(this.email, resp.generated_password);

          this.UserC.emit(resp.user);
          this.modal.close();
        }
      },

      error: () => {
        // ⚡ El isLoadingSubject.next(false) se activa automáticamente incluso en error
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo registrar el usuario',
          timer: 3500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }

    });

  }

  /**
   * Muestra un modal con el email y la contraseña generada
   * Incluye botones para copiar ambos valores
   */
  showPasswordModal(email: string, password: string) {
    Swal.fire({
      title: 'Usuario Registrado Exitosamente',
      html: `
        <div style="text-align: left; padding: 20px; overflow: hidden;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #3699FF;">
              <i class="fa-solid fa-envelope" style="color: #3699FF;"></i> Correo Electrónico:
            </p>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
              <input 
                type="text" 
                id="email-input" 
                value="${email}" 
                readonly 
                style="
                  flex: 1; 
                  padding: 10px; 
                  border: 1px solid #E4E6EF; 
                  border-radius: 6px; 
                  font-size: 14px;
                  background: #F3F6F9;
                "
              />
              <button 
                id="copy-email-btn" 
                style="
                  padding: 10px 20px; 
                  background: #3699FF; 
                  color: white; 
                  border: none; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-weight: 600;
                  transition: all 0.3s;
                "
                onmouseover="this.style.background='#187DE4'"
                onmouseout="this.style.background='#3699FF'"
              >
                📋 Copiar
              </button>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #F64E60;">
              <i class="fa-solid fa-lock" style="color: #F64E60;"></i> Contraseña Temporal:
            </p>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
              <input 
                type="text" 
                id="password-input" 
                value="${password}" 
                readonly 
                style="
                  flex: 1; 
                  padding: 10px; 
                  border: 1px solid #E4E6EF; 
                  border-radius: 6px; 
                  font-size: 14px;
                  background: #FFF5F8;
                  font-family: 'Courier New', monospace;
                  letter-spacing: 2px;
                  font-weight: bold;
                "
              />
              <button 
                id="copy-password-btn" 
                style="
                  padding: 10px 20px; 
                  background: #F64E60; 
                  color: white; 
                  border: none; 
                  border-radius: 6px; 
                  cursor: pointer;
                  font-weight: 600;
                  transition: all 0.3s;
                "
                onmouseover="this.style.background='#EE2D41'"
                onmouseout="this.style.background='#F64E60'"
              >
                📋 Copiar
              </button>
            </div>
          </div>

          <div style="
            background: #FFF4DE; 
            border-left: 4px solid #FFA800; 
            padding: 15px; 
            border-radius: 6px;
            margin-top: 20px;
          ">
            <p style="margin: 0; color: #7E8299; font-size: 13px;">
              ⚠️ <strong>Importante:</strong> Comparte estas credenciales con el usuario de forma segura. 
              La contraseña es temporal y se recomienda cambiarla en el primer inicio de sesión.
            </p>
          </div>
        </div>

      `,
      width: 600,
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#50CD89',
      didOpen: () => {
        // Funcionalidad de copiar email
        const copyEmailBtn = document.getElementById('copy-email-btn');
        const emailInput = document.getElementById('email-input') as HTMLInputElement;
        
        copyEmailBtn?.addEventListener('click', () => {
          emailInput.select();
          document.execCommand('copy');
          
          // Cambiar texto del botón temporalmente
          copyEmailBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #fcfcfd;"></i> Copiado';
          setTimeout(() => {
            copyEmailBtn.innerHTML = '📋 Copiar';
          }, 2000);
        });

        // Funcionalidad de copiar contraseña
        const copyPasswordBtn = document.getElementById('copy-password-btn');
        const passwordInput = document.getElementById('password-input') as HTMLInputElement;
        
        copyPasswordBtn?.addEventListener('click', () => {
          passwordInput.select();
          document.execCommand('copy');
          
          // Cambiar texto del botón temporalmente
          copyPasswordBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #fcfcfd;"></i> Copiado';
          setTimeout(() => {
            copyPasswordBtn.innerHTML = '📋 Copiar';
          }, 2000);
        });
      }
    });
  }

}