import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  private readonly apiUrl = '/api';

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        console.log("the response becomeeeeeeeeee==========",response);
        
        localStorage.setItem('auth_token', response.token);
      }),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        localStorage.setItem('auth_token', response.token);
      }),
    );
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('auth_token'));
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
  }
}