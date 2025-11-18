import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';
import { OverviewComponent } from './overview/overview.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileDetailsComponent } from './settings/forms/profile-details/profile-details.component';
import { DropdownMenusModule, WidgetsModule } from '../../_metronic/partials';
import {SharedModule} from "../../_metronic/shared/shared.module";

@NgModule({
  declarations: [
    AccountComponent,
    OverviewComponent,
    SettingsComponent,
    ProfileDetailsComponent,
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    DropdownMenusModule,
    WidgetsModule,
    SharedModule,
  ],
})
export class AccountModule {}
