import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Das ist der Türsteher für unsere Angular-Routen!
export const authGuard: CanActivateFn = (route, state) => {
  
  // 1. Wir holen uns den Router, um den User umzuleiten
  const router = inject(Router);
  
  // 2. Wir prüfen, ob ein Token im Browser gespeichert ist
  const token = localStorage.getItem('jwt_token');

  if (token) {
    // Wenn er ein Token hat, darf er durch!
    return true;
  } else {
    // Wenn NICHT, schicken wir ihn gnadenlos zurück zum Login!
    router.navigate(['/login']);
    return false;
  }
};