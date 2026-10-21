import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}${environment.apiUrl.endsWith('/api') ? '' : '/api'}`;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('auth_token', response.token);
        if (response.user?.id) {
          localStorage.setItem('user_id', String(response.user.id));
        }
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('auth_token'));
  }

  getUserId(): number | null {
    const storedId = localStorage.getItem('user_id');
    if (storedId) return Number(storedId);

    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: number; id?: number; user_id?: number };
      return payload.sub ?? payload.id ?? payload.user_id ?? null;
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string };
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  getUsername(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { username?: string };
      return payload.username ?? null;
    } catch {
      return null;
    }
  }

  hasPermission(permission: string): boolean {
    const permissions: Record<string, string[]> = {
      Owner: ['users:view', 'users:create', 'users:update', 'users:delete'],
      Admin: ['users:view', 'users:create', 'users:update', 'users:delete'],
      Member: ['users:view'],
    };
    return permissions[this.getRole() ?? '']?.includes(permission) ?? false;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_info');
  }
}
