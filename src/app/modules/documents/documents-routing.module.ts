import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'documentos',
    loadChildren: () => import('./documentos/documentos.module').then(m => m.DocumentosModule),
  },
  {
    path: 'vista-documento',
    loadChildren: () => import('./vista-documentos/vista-documentos.module').then(m => m.VistaDocumentosModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsRoutingModule { }
