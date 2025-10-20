import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TasksRoutingModule } from './tasks-routing.module';
import { TareasModule } from './tareas/tareas.module';
import { GruposModule } from './grupos/grupos.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TasksRoutingModule,

    GruposModule,
    TareasModule,
    
  ]
})
export class TasksModule { }
