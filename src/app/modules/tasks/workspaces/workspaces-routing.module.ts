import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspacesComponent } from './workspaces.component';
import { ListWorkspaceComponent } from './list-workspace/list-workspace.component';
import { ShareWorkspaceComponent } from './share-workspace/share-workspace.component';

const routes: Routes = [
  {
    path:'',
    component: WorkspacesComponent,
    children:[
      {
        path: 'list',
        component: ListWorkspaceComponent
      },
      {
        path: 'shared', // ✅ Nueva ruta para grupos compartidos
        component: ShareWorkspaceComponent
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspacesRoutingModule { }