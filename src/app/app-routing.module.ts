import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsComponent } from '../app/tabs/tabs.component';

const routes: Routes = [
  {path: '', component: TabsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class AppRoutingModule { }
