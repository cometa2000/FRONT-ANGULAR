import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
  sucursale_id:string = '';

  file_name:any;
  imagen_previzualiza:any;

  password:string = '';
  password_repit:string = '';
  constructor(
    public modal: NgbActiveModal,
    public usersService: UsersService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    
  }
  processFile($event:any){
    if($event.target.files[0].type.indexOf("image") < 0){
      this.toast.warning("WARN","El archivo no es una imagen");
      return;
    }
    this.file_name = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.file_name);
    reader.onloadend = () => this.imagen_previzualiza = reader.result;
  }
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

    // --- Validación: teléfono ---
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.phone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: 'El número debe contener 10 dígitos',
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

    // --- Validación: contraseña ---
    if (!this.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'La contraseña es requerida',
        timer: 3500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    // --- Validación: repetición de contraseña ---
    if (this.password !== this.password_repit) {
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
    formData.append("password", this.password);

    if (this.file_name) {
      formData.append("imagen", this.file_name);
    }

    // ----------------------------------------------------
    // Llamada al servicio
    // ----------------------------------------------------
    this.usersService.registerUser(formData).subscribe({

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
            title: 'Usuario registrado',
            text: 'El usuario se registró correctamente',
            timer: 3500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });

          this.UserC.emit(resp.user);
          this.modal.close();
        }
      },

      error: () => {
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

}
