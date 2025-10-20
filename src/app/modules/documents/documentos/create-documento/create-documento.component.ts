import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentoService } from '../service/documento.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-documento',
  templateUrl: './create-documento.component.html',
  styleUrls: ['./create-documento.component.scss']
})
export class CreateDocumentoComponent {
  @Output() DocumentoC: EventEmitter<any> = new EventEmitter();
  @Input() sucursales:any = [];
    name:any = null;
    sucursale_id:string = '';
    description:string = '';

    isDragOver: boolean = false;

    uploadedNames: string[] = [];

    file_name:any;
    file_path:any;
  
    isLoading:any;
  
    constructor(
      public modal: NgbActiveModal,
      public documentoService: DocumentoService,
      public toast: ToastrService,
    ) {
      
    }
  
    ngOnInit(): void {
      //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
      //Add 'implements OnInit' to the class.
      
    }

    
    onDragOver(event: DragEvent) {
      event.preventDefault();
      this.isDragOver = true;
    }

    onDragLeave(event: DragEvent) {
      event.preventDefault();
      this.isDragOver = false;
    }

    onFileDrop(event: DragEvent) {
      event.preventDefault();
      this.isDragOver = false;

      const file = event.dataTransfer?.files[0];
      if (file) {
        this.processFile({ target: { files: [file] } });
      }
    }
    

    processFile($event: any) {
      const file = $event.target.files[0];
      if (!file) return;

      // Validaciones MIME
      const allowedTypes = [
        "image/",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
      ];

      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        this.toast.warning("WARN", "El archivo no es una imagen o documento válido");
        return;
      }

      this.file_name = file;

      // Generar nombre único
      const originalName = file.name.replace(/\.[^/.]+$/, ""); // sin extensión
      const extension = file.name.split('.').pop(); // obtener extensión
      let uniqueName = originalName;
      let counter = 0;

      while (this.uploadedNames.includes(uniqueName + '.' + extension)) {
        counter++;
        uniqueName = `${originalName}(${counter})`;
      }

      this.name = uniqueName; // asignar nombre único
      this.uploadedNames.push(uniqueName + '.' + extension); // guardar en la lista

      // Solo si es imagen mostramos preview
      if (file.type.startsWith("image/")) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          this.file_path = reader.result; // solo para mostrar preview
        };
      }
    }

    store() {

      const formData = new FormData();
      formData.append("name", this.name);
      formData.append("sucursale_id", this.sucursale_id);
      formData.append("description", this.description);
      if (this.file_name) {
        formData.append("file", this.file_name); // 👈 archivo real
      }

      this.documentoService.registerDocumento(formData).subscribe((resp: any) => {
        if (resp.message == 403) {
          this.toast.error("Validación", resp.message_text);
        } else {
          this.toast.success("Éxito", "El documento se registró correctamente");
          this.DocumentoC.emit(resp.documento);
          this.modal.close();
        }
      });
    }
  
    
}
