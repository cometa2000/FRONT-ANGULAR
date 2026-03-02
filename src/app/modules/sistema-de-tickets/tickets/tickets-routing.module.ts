import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TicketsComponent } from './tickets.component';
import { ListTicketsComponent } from './list-tickets/list-tickets.component';

const routes: Routes = [
  {
    path: '',
    component: TicketsComponent,
    children: [
      {
        path: 'list',
        component: ListTicketsComponent,
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TicketsRoutingModule {}