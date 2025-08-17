import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor'; // Assuming this is a class

// Convert the class-based interceptor to a function-based interceptor
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

// Function-based interceptor
export const authInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // We need to use dependency injection for AuthInterceptor
  // For now, let's just pass the request to the next handler
  return next(req);
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptorFn]),
      withFetch()
    ),
    provideAnimations(),
    provideClientHydration(),
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
