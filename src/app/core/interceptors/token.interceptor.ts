import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  // Check if token needs refresh before making the request
  const refreshObservable = auth.checkAndRefreshToken();
  if (refreshObservable) {
    return refreshObservable.pipe(
      switchMap((resp) => {
        // Update tokens
        localStorage.setItem('accessToken', resp.accessToken);
        localStorage.setItem('refreshToken', resp.refreshToken);
        auth.accessToken.set(resp.accessToken);
        auth.refreshToken.set(resp.refreshToken);
        
        // Make the request with the new token
        const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${resp.accessToken}` } });
        return next(authReq);
      }),
      catchError((refreshError) => {
        // If refresh fails, route based on expiration type
        const expirationStatus = auth.getTokenExpirationStatus();
        if (expirationStatus === 'long_expired') {
          router.navigate(['/auth/session-expired']);
        } else {
          router.navigate(['/auth/token-refresh']);
        }
        return throwError(() => refreshError);
      })
    );
  }
  
  const token = auth.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle both 401 (Unauthorized) and 403 (Forbidden) for expired tokens
      if ((error.status === 401 || error.status === 403) && auth.refreshToken()) {
        return auth.refresh().pipe(
          switchMap((resp) => {
            // Update tokens
            localStorage.setItem('accessToken', resp.accessToken);
            localStorage.setItem('refreshToken', resp.refreshToken);
            auth.accessToken.set(resp.accessToken);
            auth.refreshToken.set(resp.refreshToken);
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${resp.accessToken}` } });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // If refresh fails, route based on expiration type
            const expirationStatus = auth.getTokenExpirationStatus();
            if (expirationStatus === 'long_expired') {
              router.navigate(['/auth/session-expired']);
            } else {
              router.navigate(['/auth/token-refresh']);
            }
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};