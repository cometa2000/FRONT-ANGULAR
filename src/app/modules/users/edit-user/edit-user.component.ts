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

  file_name:any;
  imagen_previzualiza:any;

  password:string = '';
  password_repit:string = '';
  sucursale_id:string = '';
  constructor(
    public modal: NgbActiveModal,
    public usersService: UsersService,
    public toast: ToastrService,
  ) {
    
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.name = this.USER_SELECTED.name
    this.surname = this.USER_SELECTED.surname
    this.email = this.USER_SELECTED.email
    this.phone = this.USER_SELECTED.phone
    this.role_id = this.USER_SELECTED.role_id
    this.gender = this.USER_SELECTED.gender
    this.type_document = this.USER_SELECTED.type_document
    this.n_document = this.USER_SELECTED.n_document
    this.address = this.USER_SELECTED.address
    this.imagen_previzualiza = this.USER_SELECTED.avatar
    this.sucursale_id = this.USER_SELECTED.sucursale_id;
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

    // --- Validación de teléfono ---
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.phone)) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: 'El número de teléfono debe contener 10 dígitos',
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
    if (this.file_name) formData.append("imagen", this.file_name);

    formData.append("sucursale_id", this.sucursale_id);

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
