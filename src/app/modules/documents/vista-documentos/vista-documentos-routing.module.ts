import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VistaDocumentosComponent } from './vista-documentos.component';
import { ListVistaDocumentoComponent } from './list-vista-documento/list-vista-documento.component';

const routes: Routes = [
  {
    path:'',
    component: VistaDocumentosComponent,
    children:[
      {
        path: 'list/:sucursalId',
        component: ListVistaDocumentoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VistaDocumentosRoutingModule { }
