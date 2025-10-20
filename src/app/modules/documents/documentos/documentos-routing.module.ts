import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentosComponent } from './documentos.component';
import { ListDocumentoComponent } from './list-documento/list-documento.component';

const routes: Routes = [
  {
    path:'',
    component: DocumentosComponent,
    children:[
      {
        path: 'list',
        component: ListDocumentoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentosRoutingModule { }
