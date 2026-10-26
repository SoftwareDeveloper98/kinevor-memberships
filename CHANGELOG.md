# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-20

### Added

- .NET 9 memberships module with plan catalogue, subscriptions, snapshot
  benefits, overlap protection, freeze/resume, renewal and cancellation.
- Staff endpoints for subscription search, current cover, detail and lifecycle
  actions.
- Member self-service endpoints under `/api/v1/me/memberships`, scoped to the
  authenticated member.
- Platform response envelope, authorization policies, SQLite persistence and EF
  Core repositories.
- Standalone demo API with Swagger, CORS, health check and deterministic plans and
  demo members.
- Backend test suite covering plans, starts, freezes, renewals, cancellations,
  ownership and the demo host.
- Angular 21 library `@softwaredeveloper98/kinevor-memberships-web` with plan
  catalogue, overview, detail, lifecycle UI, typed gateway, facade and routes.
- Angular demo with a demo-member switcher and local platform package workflow.
- Flutter package `kinevor_memberships` with typed HTTP client, repository,
  dashboard, catalogue, detail lifecycle sheets, theme, strings and exports.
- Flutter example with a demo-member switcher.
- Vitest, Flutter widget/client and golden tests.
- Playwright screenshot capture for the web and API.
- Web, Flutter, API and root documentation plus CI and release workflows.

[0.1.0]: https://github.com/SoftwareDeveloper98/kinevor-memberships/releases/tag/v0.1.0
