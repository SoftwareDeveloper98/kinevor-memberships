import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideMemberships } from '@softwaredeveloper98/kinevor-memberships-web';
import { appRoutes } from './app.routes';
import { demoApiInterceptor } from './demo-api.interceptor';

/** Demo application configuration: router, HTTP headers and the memberships feature. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([demoApiInterceptor])),
    provideMemberships({ apiBaseUrl: 'http://localhost:5084/api/v1' }),
  ],
};
