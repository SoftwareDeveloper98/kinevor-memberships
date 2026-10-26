import { Routes } from '@angular/router';
import { MEMBERSHIPS_ROUTES } from '@softwaredeveloper98/kinevor-memberships-web';

/** Demo routes: member dashboard, plan catalogue and subscription detail. */
export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'memberships' },
  { path: '', children: MEMBERSHIPS_ROUTES },
  { path: '**', redirectTo: 'memberships' },
];
