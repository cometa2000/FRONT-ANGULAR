import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentosRoutingModule } from './documentos-routing.module';
import { DocumentosComponent } from './documentos.component';
import { CreateDocumentoComponent } from './create-documento/create-documento.component';
import { DeleteDocumentoComponent } from './delete-documento/delete-documento.component';
import { EditDocumentoComponent } from './edit-documento/edit-documento.component';
import { ListDocumentoComponent } from './list-documento/list-documento.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';


@NgModule({
  declarations: [
    DocumentosComponent,
    CreateDocumentoComponent,
    DeleteDocumentoComponent,
    EditDocumentoComponent,
    ListDocumentoComponent,
  ],
  imports: [
    CommonModule,
    DocumentosRoutingModule,

    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,
  ]
})
export class DocumentosModule { }
