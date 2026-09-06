import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';

export const routes: Routes = [
 // Wenn der Pfad 'login' ist, lade das Login-Component
  { path: 'login', component: Login },
  
  // 2. NEUE ROUTE: Wenn der Pfad 'dashboard' ist, lade das Dashboard-Component!
  { path: 'dashboard', component: DashboardComponent },
  
  // Wenn der Pfad leer ist (http://localhost:4200/), leite automatisch zum Login weiter
  { path: '', redirectTo: '/login', pathMatch: 'full' } 
];
