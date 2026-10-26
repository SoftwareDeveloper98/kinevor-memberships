# kinevor_memberships

Flutter membership plans, current cover and lifecycle UI for Kinevor. The package
is member-facing: browse plans, start a subscription, review cover and benefits,
freeze, resume, renew or cancel it. It ships with the Architectural Obsidian theme,
editable strings and a repository boundary for tests or custom transport.

| Dashboard | Plans |
| --- | --- |
| ![Dashboard](https://raw.githubusercontent.com/SoftwareDeveloper98/kinevor-memberships/main/docs/screenshots/mobile-membership-dashboard.png) | ![Plans](https://raw.githubusercontent.com/SoftwareDeveloper98/kinevor-memberships/main/docs/screenshots/mobile-plans.png) |

## Install

The package is not published to pub.dev yet. Add it from the repository tag:

```yaml
dependencies:
  kinevor_memberships:
    git:
      url: https://github.com/SoftwareDeveloper98/kinevor-memberships.git
      path: mobile/packages/kinevor_memberships
      ref: v0.1.0
```

For local development, use a path dependency:

```yaml
dependencies:
  kinevor_memberships:
    path: ../kinevor-memberships/mobile/packages/kinevor_memberships
```

Requires Dart 3.9+ and Flutter 3.35+.

## Register

Create the HTTP client, wrap it in the remote repository, and hand it to a screen:

```dart
import 'package:flutter/material.dart';
import 'package:kinevor_memberships/kinevor_memberships.dart';

final client = KinevorMembershipsClient(
  baseUrl: Uri.parse('https://api.example.com/api/v1'),
  headers: {'Authorization': 'Bearer $accessToken'},
);
final repository = RemoteMembershipsRepository(client);

MaterialApp(
  theme: KinevorMembershipsTheme.dark(),
  home: MembershipDashboardScreen(repository: repository),
);
```

Close the client when the owning widget is disposed if the package created its
underlying `http.Client`:

```dart
@override
void dispose() {
  client.close();
  super.dispose();
}
```

Screens take a `MembershipsRepository`, so tests and previews can use an
in-memory implementation instead of HTTP. The client throws
`MembershipsApiException` for transport, payload and API failures; it carries the
HTTP `statusCode` when available and extracts the platform envelope message.

## Screens

| Widget | Purpose |
| --- | --- |
| `MembershipDashboardScreen` | Current cover hero, renewal/progress facts, benefits, history, plan links |
| `MembershipPlansScreen` | Plan catalogue, current-plan marker, start flow |
| `MembershipDetailScreen` | Full subscription facts, freeze/resume/renew/cancel actions |

The dashboard opens the catalogue and detail screens itself. Hosts can place the
screens anywhere in their own navigator, or add toolbar actions through the
dashboard's `actions` parameter. All screens accept a `MembershipsStrings`
instance and refresh from the API after lifecycle actions.

## API contract

The default client calls the Kinevor self-service API:

| Method | Route |
| --- | --- |
| `GET` | `/plans` |
| `GET` | `/me/memberships` |
| `GET` | `/me/memberships/current` |
| `GET` | `/me/memberships/{id}` |
| `POST` | `/me/memberships` |
| `POST` | `/me/memberships/{id}/freeze` |
| `POST` | `/me/memberships/{id}/resume` |
| `POST` | `/me/memberships/{id}/cancel` |
| `POST` | `/me/memberships/{id}/renew` |

Responses must use the platform `ApiResponse<T>` envelope. The current-cover
endpoint may return `null` data when the member has no cover. Extra headers are
attached to every request, which supports a host token or the demo API's
development-only trust headers.

Lifecycle rules are enforced by the API:

- Freezing takes an inclusive `until` date and is limited to 90 days. Resuming
  returns any unused frozen days to the end of cover.
- Renewal adds whole billing periods to the end date, or starts from today when
  cover has expired.
- Cancellation is immediate and terminal.
- Starting a plan is rejected with `409` while the member already has overlapping
  cover.

The package presents results but does not duplicate these domain rules. Freeze
choices are 7, 14, 30, 60 or 90 days.

## Customisation

- **Theme** - use `KinevorMembershipsTheme.dark()` for the complete palette, or
  copy its tokens into an app theme. Sora is bundled and declared in `pubspec`.
- **Strings** - pass a `MembershipsStrings` copy to any screen. Every visible
  label has a constructor argument.
- **Repository** - implement `MembershipsRepository` to cache, mock or adapt a
  different backend.
- **Navigation** - screens push their own detail/catalogue routes with Material
  `PageRouteBuilder`s. Place the root screen inside the host's shell for its own
  chrome and actions.

The demo uses `X-Demo-Role: Member` and `X-Demo-Member` headers only because it
runs against the standalone demo API. Production apps should use real bearer or
session authentication.

## Example

```powershell
cd example
flutter pub get
flutter run -d windows
```

The example defaults to `http://localhost:5084/api/v1` and includes a member
switcher for the five seeded demo members. Override the API for another host:

```powershell
flutter run -d chrome `
  --dart-define=KINEVOR_API_BASE_URL=http://localhost:5084/api/v1
```

Android emulators reach the host machine at `http://10.0.2.2:5084/api/v1`.

## Testing

```powershell
flutter pub get
dart format --output=none --set-exit-if-changed lib test example/lib
flutter analyze
flutter test
```

The suite covers the HTTP client, repository, dashboard, catalogue, detail
actions and 390×844 golden images. Regenerate goldens after intentional visual
changes:

```powershell
flutter test --update-goldens test\membership_golden_test.dart
```

## License

MIT. Sora is licensed under the SIL Open Font License; see
`assets/fonts/Sora-LICENSE.txt`.
