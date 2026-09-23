import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth-guard';
import { RegisterComponent } from './features/auth/register/register';
import { VerifyComponent } from './features/auth/verify/verify';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'verify', component: VerifyComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent }, // <-- HIER
  { path: 'reset-password', component: ResetPasswordComponent },   // <-- HIER
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },{
  path: 'impressum',
  loadComponent: () => import('./features/legal/impressum/impressum').then(m => m.ImpressumComponent)
},
{
  path: 'datenschutz',
  loadComponent: () => import('./features/legal/datenschutz/datenschutz').then(m => m.DatenschutzComponent)
},
{
  path: 'agb',
  loadComponent: () => import('./features/legal/agb/agb').then(m => m.AgbComponent)
}
];