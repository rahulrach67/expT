import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserSummary {
  id: number;
  username: string;
  role: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export interface JwtPayload {
  sub?: number | string;
  id?: number | string;
  user_id?: number | string;
  username?: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface MeResponse {
  user: UserSummary;
  tokenMeta: {
    issuedAt: string | null;
    expiresAt: string | null;
  };
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: UserSummary;
  expiresAt?: string | null;
  message?: string;
  code?: string;
}

/**
 * Service managing client-side authentication, JWT token storage, decoding,
 * expiration verification, and role-based permissions.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}${environment.apiUrl.endsWith('/api') ? '' : '/api'}`;

  /**
   * Authenticates the user with username and password, storing the issued JWT token.
   *
   * @param credentials - User credentials.
   * @returns Observable emitting the AuthResponse with token and user object.
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        if (response.user?.id) {
          localStorage.setItem('user_id', String(response.user.id));
        }
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }),
    );
  }

  /**
   * Registers a new user account and stores the returned JWT token.
   *
   * @param data - Registration details (username, email, password).
   * @returns Observable emitting the AuthResponse.
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        if (response.user?.id) {
          localStorage.setItem('user_id', String(response.user.id));
        }
        if (response.user) {
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      }),
    );
  }

  /**
   * Retrieves the raw JWT token from localStorage.
   *
   * @returns The raw JWT string, or null if not logged in.
   */
  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Decodes a JWT token payload without signature verification on the client.
   * Handles base64url padding and UTF-8 characters safely.
   *
   * @param rawToken - Optional raw token string (defaults to stored token).
   * @returns Decoded JwtPayload object or null if invalid.
   */
  decodeToken(rawToken?: string): JwtPayload | null {
    const token = rawToken ?? this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Convert Base64URL to standard Base64
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Checks whether the given or currently stored JWT token is expired.
   *
   * @param rawToken - Optional raw token to inspect.
   * @returns True if the token is expired or invalid, false if currently valid.
   */
  isTokenExpired(rawToken?: string): boolean {
    const payload = this.decodeToken(rawToken);
    if (!payload || !payload.exp) {
      // If token cannot be decoded or has no exp, consider it expired/invalid
      return !payload;
    }
    // exp is in seconds, convert to milliseconds
    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Returns the expiration Date object of the JWT token.
   *
   * @param rawToken - Optional token string.
   * @returns Expiration Date or null.
   */
  getTokenExpirationDate(rawToken?: string): Date | null {
    const payload = this.decodeToken(rawToken);
    if (!payload?.exp) return null;
    return new Date(payload.exp * 1000);
  }

  /**
   * Checks if user has a valid, unexpired authentication token.
   *
   * @returns True if logged in with a non-expired token.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  /**
   * Retrieves the current user's ID from localStorage or decoded JWT token.
   *
   * @returns The user ID number, or null if unauthenticated.
   */
  getUserId(): number | null {
    const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : null;
    if (storedId) return Number(storedId);

    const payload = this.decodeToken();
    if (!payload) return null;

    const id = payload.id ?? payload.sub ?? payload.user_id;
    return id ? Number(id) : null;
  }

  /**
   * Retrieves the current user's role from the decoded JWT token.
   *
   * @returns Role string ('Owner' | 'Admin' | 'Member') or null.
   */
  getRole(): string | null {
    const payload = this.decodeToken();
    return payload?.role ?? null;
  }

  /**
   * Retrieves the username of the currently authenticated user.
   *
   * @returns Username string, or null.
   */
  getUsername(): string | null {
    const payload = this.decodeToken();
    return payload?.username ?? null;
  }

  /**
   * Retrieves full profile information of the currently authenticated user.
   *
   * @returns UserSummary object or null.
   */
  getCurrentUser(): UserSummary | null {
    const id = this.getUserId();
    const username = this.getUsername();
    const role = this.getRole() || 'Member';

    if (!id || !username) return null;
    return { id, username, role };
  }

  /**
   * Fetches the current user's profile and token metadata directly from the backend API.
   * Uses GET /api/auth/me.
   *
   * @returns Observable emitting user profile and token metadata.
   */
  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`);
  }

  /**
   * Calls the backend API to verify token validity.
   * Uses POST /api/auth/verify.
   *
   * @param token - Optional token string (defaults to stored token).
   * @returns Observable emitting token validity and decoded user info.
   */
  verifyToken(token?: string): Observable<VerifyTokenResponse> {
    const tokenToVerify = token ?? this.getToken();
    return this.http.post<VerifyTokenResponse>(`${this.apiUrl}/auth/verify`, { token: tokenToVerify });
  }

  /**
   * Evaluates if the authenticated user has a specific permission.
   *
   * @param permission - Permission name (e.g. 'users:delete').
   * @returns True if granted, false otherwise.
   */
  hasPermission(permission: string): boolean {
    const permissions: Record<string, string[]> = {
      Owner: ['users:view', 'users:create', 'users:update', 'users:delete'],
      Admin: ['users:view', 'users:create', 'users:update', 'users:delete'],
      Member: ['users:view'],
    };
    return permissions[this.getRole() ?? '']?.includes(permission) ?? false;
  }

  /**
   * Clears all client-side auth tokens and user session data.
   */
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_info');
    }
  }
}

