import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VistaDocumentosRoutingModule } from './vista-documentos-routing.module';
import { VistaDocumentosComponent } from './vista-documentos.component';
import { ListVistaDocumentoComponent } from './list-vista-documento/list-vista-documento.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ViewVistaDocumentoComponent } from './view-vista-documento/view-vista-documento.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DragDropModule } from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [
    VistaDocumentosComponent,
    ListVistaDocumentoComponent,
    ViewVistaDocumentoComponent,
  ],
  imports: [
    CommonModule,
    VistaDocumentosRoutingModule,
    SharedModule,
    DragDropModule,

    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,
  ]
})
export class VistaDocumentosModule { }
