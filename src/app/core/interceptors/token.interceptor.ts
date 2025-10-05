import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.refreshToken()) {
        return auth.refresh().pipe(
          switchMap((resp) => {
            // Update tokens
            localStorage.setItem('accessToken', resp.accessToken);
            localStorage.setItem('refreshToken', resp.refreshToken);
            auth.accessToken.set(resp.accessToken);
            auth.refreshToken.set(resp.refreshToken);
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${resp.accessToken}` } });
            return next(retryReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
};