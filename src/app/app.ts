import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// NEU: Import für das Toast-Modul!
import { ToastModule } from 'primeng/toast'; 
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  standalone: true,
  // NEU: ToastModule hier hinzufügen!
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule], 
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'medical-app-frontend';
}