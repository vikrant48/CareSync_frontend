import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, inject, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withInterceptors, withFetch, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { IdleDetectionService } from './services/idle-detection.service';

// Function-based interceptor
export const authInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Get the injector to manually inject services
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Log all HTTP requests for debugging
  console.log('🌐 HTTP Request:', req.method, req.url);
  
  // Add auth token to request if available
  const token = authService.getToken();
  console.log('🔐 Interceptor - Request:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : 'none',
    headers: req.headers.keys()
  });
  
  if (token) {
    req = addToken(req, token);
    console.log('✅ Token added to request');
  } else {
    console.log('❌ No token available for request');
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🚨 HTTP Error in interceptor:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: error.message,
        error: error.error
      });
      
      if ((error.status === 401 || error.status === 403) && !req.url.includes('auth/refresh-token')) {
        console.log('🔄 Attempting to handle auth error (401/403)');
        return handle401Error(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

// Helper functions for the interceptor
const isRefreshing = signal(false);
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handle401Error(
  request: HttpRequest<any>, 
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  console.log('🔄 handle401Error called for request:', request.url);
  
  if (!isRefreshing()) {
    console.log('🔄 Starting token refresh process');
    isRefreshing.set(true);
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        console.log('✅ Token refresh successful, retrying request');
        isRefreshing.set(false);
        refreshTokenSubject.next(response.accessToken);
        return next(addToken(request, response.accessToken));
      }),
      catchError((error) => {
        console.log('❌ Token refresh failed, logging out user:', error);
        isRefreshing.set(false);
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(request, token as string)))
    );
  }
};


// Material Design imports
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';

function initializeIdleDetection(idleService: IdleDetectionService) {
  return () => {
    idleService.init();
    return Promise.resolve();
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptorFn]),
      withFetch()
    ),
    provideAnimations(),
    provideClientHydration(),
    IdleDetectionService,
    {
      provide: APP_INITIALIZER,
      useFactory: (idleService: IdleDetectionService) => initializeIdleDetection(idleService),
      deps: [IdleDetectionService],
      multi: true
    },
    importProvidersFrom([
      MatNativeDateModule,
      MatDatepickerModule,
      MatSnackBarModule,
      MatDialogModule,
      MatProgressBarModule,
      MatProgressSpinnerModule,
      MatToolbarModule,
      MatButtonModule,
      MatIconModule,
      MatSidenavModule,
      MatListModule,
      MatMenuModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatCheckboxModule,
      MatDividerModule,
      MatTooltipModule,
      MatChipsModule,
      MatBadgeModule,
      MatTabsModule,
      MatTableModule,
      MatPaginatorModule,
      MatSortModule,
      MatStepperModule
    ])
  ]
};
