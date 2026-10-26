# Kinevor Memberships example

Runnable Flutter host for `kinevor_memberships`. It shows the dashboard for a
seeded demo member and lets you switch between all five members from the app bar.

## Run

Start the demo API first (see the repository root README), then:

```powershell
flutter pub get
flutter run -d windows
```

The default API root is `http://localhost:5084/api/v1`. Override it without
editing code:

```powershell
flutter run -d chrome `
  --dart-define=KINEVOR_API_BASE_URL=http://localhost:5084/api/v1
```

For an Android emulator use `http://10.0.2.2:5084/api/v1`. Flutter web must be
served from an origin allowed by the demo API CORS policy (`http://localhost:4203`
by default), or add the origin to `Program.cs`.

## Demo members

| Member | Current cover |
| --- | --- |
| Maya Thompson | Active Performance membership with history |
| Daniel Okafor | Active Foundation membership |
| Sofia Rossi | Frozen Elite membership |
| Liam Chen | Expired cover, shows the start flow |
| Amina Yusuf | Annual Elite membership |

The example sends `X-Demo-Role: Member` and the selected `X-Demo-Member` header.
Those headers are trusted only by the standalone demo API and must not be used in
production.

## Checks

```powershell
dart format --output=none --set-exit-if-changed lib
flutter analyze
```
