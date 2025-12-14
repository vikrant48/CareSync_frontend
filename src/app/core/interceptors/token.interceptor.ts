import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip token logic for auth endpoints (login, register, refresh, etc.) EXCEPT logout, current-user, and change-password
  if (req.url.includes('/api/auth/') &&
    !req.url.includes('/api/auth/logout') &&
    !req.url.includes('/api/auth/email-verification') &&
    !req.url.includes('/api/auth/current-user') &&
    !req.url.includes('/api/auth/change-password')) {
    return next(req);
  }

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
        // If proactive refresh fails, clear everything and redirect
        auth.logout();
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
      // Handle 401 (Unauthorized) for expired tokens
      // NOTE: We do not handle 403 (Forbidden) here anymore, as it indicates valid token but insufficient permissions.
      // Auto-logout on 403 causes poor UX when it's just a permission error.
      if (error.status === 401 && auth.refreshToken()) {

        // Prevent infinite loops: If the failed request was already a refresh attempt, give up.
        if (req.url.includes('/auth/refresh')) {
          auth.logout();
          return throwError(() => error);
        }

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
            // If refresh fails, clearly logout the user to scrub the invalid session
            auth.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};