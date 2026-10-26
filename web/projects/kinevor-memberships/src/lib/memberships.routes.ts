import { Routes } from '@angular/router';
import { MembershipDetailComponent } from './membership-detail.component';
import { MembershipOverviewComponent } from './membership-overview.component';
import { PlanCatalogueComponent } from './plan-catalogue.component';

/** Routes exposed by the memberships feature. */
export const MEMBERSHIPS_ROUTES: Routes = [
  { path: 'memberships/plans', component: PlanCatalogueComponent },
  { path: 'memberships/:id', component: MembershipDetailComponent },
  { path: 'memberships', component: MembershipOverviewComponent },
];
