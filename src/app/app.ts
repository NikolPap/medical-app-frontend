import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header';
import { FooterComponent } from './core/layout/footer/footer';

// NEU: Import für das Toast-Modul!
import { ToastModule } from 'primeng/toast'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // NEU: ToastModule hier hinzufügen!
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastModule], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'medical-app-frontend';
}