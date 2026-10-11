import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getTokenPayload, homeFor, isExpired } from '../utils/jwt';

export const roleGuard = (...allowedRoles: string[]): CanActivateFn => () => {
  const router = inject(Router);
  const payload = getTokenPayload();

  if (!payload || isExpired(payload)) {
    localStorage.removeItem('jwt_token');
    return router.createUrlTree(['/login']);
  }

  if (allowedRoles.includes(payload.role)) {
    return true;
  }

  // Falsche Rolle: zur passenden Startseite umleiten
  return router.createUrlTree([homeFor(payload.role)]);
};