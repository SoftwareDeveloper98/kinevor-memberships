# @softwaredeveloper98/kinevor-memberships-web

Angular 21 member-facing membership UI for Kinevor. The package ships a plan
catalogue, a current-membership dashboard with history, and a detail page with
freeze, resume, renew and cancel actions.

## GitHub Packages access

This package is private. Configure the scope and token before installing:

```ini
@softwaredeveloper98:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${KINEVOR_PACKAGES_TOKEN}
```

## Install

```bash
npm install @softwaredeveloper98/kinevor-memberships-web
```

The package peers on Angular 21, Angular Material 21 and
`@softwaredeveloper98/kinevor-platform-web`.

## Register

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideMemberships } from '@softwaredeveloper98/kinevor-memberships-web';

export const appConfig = {
  providers: [
    provideHttpClient(),
    provideMemberships({
      apiBaseUrl: 'http://localhost:5084/api/v1',
    }),
  ],
};
```

The host must provide `HttpClient`; the default `HttpMembershipsGateway` calls
the self-service `/me/memberships` endpoints.

## Routes

`MEMBERSHIPS_ROUTES` exposes:

| Route                 | Screen                                  |
| --------------------- | --------------------------------------- |
| `memberships`         | Current cover, actions and history      |
| `memberships/plans`   | Plan catalogue and start flow           |
| `memberships/:id`     | Subscription detail and lifecycle       |

Mount the exported routes under the host's authenticated shell, or use the
standalone components directly:

- `PlanCatalogueComponent`
- `MembershipOverviewComponent`
- `MembershipDetailComponent`

## API contract

All requests expect the standard Kinevor envelope (`{ success, data }`) and a
signed-in member identity. The demo host authenticates requests with the
`X-Demo-Role: Member` and `X-Demo-Member` headers.

Lifecycle rules enforced by the API:

- Freezing uses an inclusive `until` date and extends the subscription end date.
- Renewals extend from the existing end date (or from today when expired).
- Cancellation is terminal.
- Starting a plan is rejected with `409` while cover overlaps an existing plan.

## Development

From the workspace root:

```bash
npm run install:local
npm test
npm run build:all
npm start
```

The demo runs on `http://localhost:4203` and expects the demo API at
`http://localhost:5084`.

## License

MIT
