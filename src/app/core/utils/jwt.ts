export interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
}

export function getTokenPayload(): JwtPayload | null {
  const token = localStorage.getItem('jwt_token');
  if (!token) return null;

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

export function homeFor(role: string): string {
  return role === 'ROLE_ADMIN' ? '/admin' : '/dashboard';
}