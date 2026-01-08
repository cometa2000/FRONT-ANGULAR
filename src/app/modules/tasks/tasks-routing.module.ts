import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'workspaces',
    loadChildren: () => import('./workspaces/workspaces.module').then((m) => m.WorkspacesModule),
  },
  {
    path: 'grupos/:workspaceId',
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
