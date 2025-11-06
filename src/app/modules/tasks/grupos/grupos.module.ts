import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GruposRoutingModule } from './grupos-routing.module';
import { GruposComponent } from './grupos.component';
import { ListGrupoComponent } from './list-grupo/list-grupo.component';
import { CreateGrupoComponent } from './create-grupo/create-grupo.component';
import { DeleteGrupoComponent } from './delete-grupo/delete-grupo.component';
import { EditGrupoComponent } from './edit-grupo/edit-grupo.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ShareGrupoComponent } from './share-grupo/share-grupo.component';
import { PermisosGrupoModalComponent } from './permisos-grupo-modal/permisos-grupo-modal.component';
import { PermisosPersonalizadosModalComponent } from './permisos-personalizados-modal/permisos-personalizados-modal.component';


@NgModule({
  declarations: [
    GruposComponent,
    ListGrupoComponent,
    CreateGrupoComponent,
    DeleteGrupoComponent,
    EditGrupoComponent,
    ShareGrupoComponent,
    PermisosGrupoModalComponent,
    PermisosPersonalizadosModalComponent
  ],
  imports: [
    CommonModule,
    GruposRoutingModule,

    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,  
  ]
})
export class GruposModule { }
