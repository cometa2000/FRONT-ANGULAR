import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TicketsRoutingModule } from './tickets-routing.module';
import { TicketsComponent } from './tickets.component';
import { ListTicketsComponent } from './list-tickets/list-tickets.component';
import { CreateTicketsComponent } from './create-tickets/create-tickets.component';
import { EditTicketsComponent } from './edit-tickets/edit-tickets.component';
import { DeleteTicketsComponent } from './delete-tickets/delete-tickets.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';

@NgModule({
  declarations: [
    TicketsComponent,
    ListTicketsComponent,
    CreateTicketsComponent,
    EditTicketsComponent,
    DeleteTicketsComponent
  ],
  imports: [
    CommonModule,
    TicketsRoutingModule,

    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,
  ]
})
export class TicketsModule { }
