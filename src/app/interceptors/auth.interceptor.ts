import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : null;

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
    headers['user-id'] = userId;
  }

  if (Object.keys(headers).length > 0) {
    const authReq = req.clone({
      setHeaders: headers,
    });
    return next(authReq);
  }

  return next(req);
};
