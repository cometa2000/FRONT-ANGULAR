import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocumentsRoutingModule } from './documents-routing.module';
import { DocumentosModule } from './documentos/documentos.module';
import { VistaDocumentosModule } from './vista-documentos/vista-documentos.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DocumentsRoutingModule,

    DocumentosModule,
    VistaDocumentosModule,
  ]
})
export class DocumentsModule { }
