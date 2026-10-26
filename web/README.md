# Kinevor Memberships web

Angular 21 workspace for the memberships module: a publishable library in
`projects/kinevor-memberships` and a standalone demo in `projects/demo`.

## Library

`@softwaredeveloper98/kinevor-memberships-web` exports the plan catalogue,
current-cover dashboard, subscription detail, routes, facade, HTTP gateway and
`provideMemberships()`. See
[`projects/kinevor-memberships/README.md`](projects/kinevor-memberships/README.md)
for installation and host registration.

## Demo

The demo runs on `http://localhost:4203` and expects the standalone API on
`http://localhost:5084`. It includes a member switcher in the header.

| Route | Screen |
| --- | --- |
| `/memberships` | Current cover, actions and history |
| `/memberships/plans` | Plan catalogue and start flow |
| `/memberships/:id` | Subscription detail and lifecycle actions |

The demo interceptor sends `X-Demo-Role: Member` and the selected
`X-Demo-Member`. The switcher covers Maya (active Performance), Daniel (active
Foundation), Sofia (frozen Elite), Liam (expired, start flow) and Amina (annual
Elite).

## Commands

```powershell
npm run install:local   # link a local kinevor-platform-web build
npm start               # demo on port 4203
npm test                # library unit tests
npm run build           # package the library
npm run build:all       # library + demo production builds
npm run capture:screenshots
```

`install:local` expects `../../kinevor-platform/web/dist/kinevor-platform-web`.
It temporarily rewrites the dependency, installs, restores `package.json`, and
removes the generated lockfile. Use normal `npm install` when the platform
package is available from GitHub Packages.

## Screenshots

With the API and demo running:

```powershell
npm run capture:screenshots
```

Playwright writes `web-plans.png`, `web-membership-detail.png`,
`web-membership-dashboard.png` and `api-swagger.png` to `../docs/screenshots` at
1440×1040. Set `KINEVOR_WEB_URL`, `KINEVOR_API_URL` or `PLAYWRIGHT_CHANNEL` to
override the defaults.

## Testing

`npm test` runs Vitest over the gateway and facade with a mocked HTTP backend.
The library and demo builds run in production mode through `npm run build:all`.

## License

MIT.
