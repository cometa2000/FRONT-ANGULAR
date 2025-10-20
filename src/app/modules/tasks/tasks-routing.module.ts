import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'grupos',
    loadChildren: () => import('./grupos/grupos.module').then((m) => m.GruposModule),
  },
  {
    path: 'tareas',
    loadChildren: () => import('./tareas/tareas.module').then((m) => m.TareasModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }
