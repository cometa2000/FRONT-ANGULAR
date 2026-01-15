import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CronogramaProformasRoutingModule } from './cronograma-proformas-routing.module';
import { CronogramaProformasComponent } from './cronograma-proformas.component';
import { CreateEditEventComponent } from './components/create-edit-event/create-edit-event.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  declarations: [
    CronogramaProformasComponent,
    CreateEditEventComponent
  ],
  imports: [
    CommonModule,
    CronogramaProformasRoutingModule,
    FullCalendarModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,
  ]
})
export class CronogramaProformasModule { }