import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}${environment.apiUrl.endsWith('/api') ? '' : '/api'}/users`;

  getUser(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }


}
