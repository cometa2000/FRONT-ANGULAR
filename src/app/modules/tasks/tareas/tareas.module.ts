import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TareasRoutingModule } from './tareas-routing.module';
import { TareasComponent } from './tareas.component';
import { CreateTareaComponent } from './create-tarea/create-tarea.component';
import { DeleteTareaComponent } from './delete-tarea/delete-tarea.component';
import { EditTareaComponent } from './edit-tarea/edit-tarea.component';
import { ListTareaComponent } from './list-tarea/list-tarea.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { CreateListaComponent } from './create-lista/create-lista.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { EditListaComponent } from './edit-lista/edit-lista.component';
import { DelteListaComponent } from './delte-lista/delte-lista.component';
import { TableroTareasComponent } from './tablero-tareas/tablero-tareas.component';
import { EtiquetasComponent } from './etiquetas/etiquetas.component';
import { FechasComponent } from './fechas/fechas.component';
import { ChecklistsComponent } from './checklists/checklists.component';
import { AdjuntarModalComponent } from './adjuntar-modal/adjuntar-modal.component';
import { AssignMembersTareaComponent } from './assign-members-tarea/assign-members-tarea.component';


@NgModule({
  declarations: [
    TareasComponent,
    CreateTareaComponent,
    DeleteTareaComponent,
    EditTareaComponent,
    ListTareaComponent,
    CreateListaComponent,
    EditListaComponent,
    DelteListaComponent,
    TableroTareasComponent,
    EtiquetasComponent,
    FechasComponent,
    ChecklistsComponent,
    AdjuntarModalComponent,
    AssignMembersTareaComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    TareasRoutingModule,
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
export class TareasModule { }
