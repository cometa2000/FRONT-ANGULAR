import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GruposComponent } from './grupos.component';
import { ListGrupoComponent } from './list-grupo/list-grupo.component';

const routes: Routes = [
  {
      path:'',
      component: GruposComponent,
      children:[
        {
          path: 'list',
          component: ListGrupoComponent
        }
      ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GruposRoutingModule { }
