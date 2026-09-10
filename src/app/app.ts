import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header';
import { FooterComponent } from './core/layout/footer/footer';
@Component({
  selector: 'app-root',
  standalone: true,
  // HIER DIE COMPONENTS HINZUFÜGEN!
  imports: [RouterOutlet, HeaderComponent, FooterComponent], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App { }