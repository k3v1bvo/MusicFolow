import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { MasterComponent } from './master/master.component';
import { SlaveComponent } from './slave/slave.component';
import { LandingComponent } from './landing/landing.component';

@NgModule({
  declarations: [
    AppComponent,
    MasterComponent,
    SlaveComponent,
    LandingComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
