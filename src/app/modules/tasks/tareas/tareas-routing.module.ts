import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListTareaComponent } from './list-tarea/list-tarea.component';
import { TareasComponent } from './tareas.component';
import { TableroTareasComponent } from './tablero-tareas/tablero-tareas.component';

const routes: Routes = [
  {
    path:'',
    component: TareasComponent,
    children:[
      {
        path: 'list',
        component: ListTareaComponent
      },
      {
        path: 'tablero/:grupo_id', // ← NUEVA RUTA
        component: TableroTareasComponent // Vista del tablero
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TareasRoutingModule { }
