import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspacesRoutingModule } from './workspaces-routing.module';
import { WorkspacesComponent } from './workspaces.component';
import { DeleteWorkspaceComponent } from './delete-workspace/delete-workspace.component';
import { EditWorkspaceComponent } from './edit-workspace/edit-workspace.component';
import { CreateWorkspaceComponent } from './create-workspace/create-workspace.component';
import { ListWorkspaceComponent } from './list-workspace/list-workspace.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ShareWorkspaceComponent } from './share-workspace/share-workspace.component';


@NgModule({
  declarations: [
    WorkspacesComponent,
    DeleteWorkspaceComponent,
    EditWorkspaceComponent,
    CreateWorkspaceComponent,
    ListWorkspaceComponent,
    ShareWorkspaceComponent
  ],
  imports: [
    CommonModule,
    WorkspacesRoutingModule,

    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    NgbModalModule,
    NgbPaginationModule,
  ]
})
export class WorkspacesModule { }
