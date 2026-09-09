import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/users';

  getUsers(): Observable<UserRecord[]> {
    return this.http.get<UserRecord[]>(this.apiUrl);
  }

  createUser(user: CreateUserRequest): Observable<UserRecord> {
    return this.http.post<UserRecord>(this.apiUrl, user);
  }

  updateUser(id: number, user: CreateUserRequest): Observable<UserRecord> {
    return this.http.put<UserRecord>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}