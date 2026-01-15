import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard.component';
import { ModalsModule, WidgetsModule } from '../../_metronic/partials';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { GanttFiltersModalComponent } from './gantt-filters-modal/gantt-filters-modal.component';
import { FilterPipe } from './filter.pipe';

// ✅ Importar servicio
import { GanttService } from './service/gantt.service';

@NgModule({
  declarations: [
    DashboardComponent, 
    GanttChartComponent, 
    GanttFiltersModalComponent,
    FilterPipe  // ✅ Agregar FilterPipe
  ],
  imports: [
    CommonModule,  // ✅ Esto provee AsyncPipe, NgIf, NgFor
    FormsModule,   // ✅ Esto provee ngModel
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardComponent,
      },
    ]),
    WidgetsModule,
    ModalsModule,
  ],
  providers: [
    GanttService  // ✅ Agregar servicio
  ]
})
export class DashboardModule {}