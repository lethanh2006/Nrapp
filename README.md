# Nrapp

Nrapp is the Expo/React Native client for NRApp's internal operations platform.
It connects to the NRApp API Gateway for authentication, user data, realtime
chat, tasks, canteen ordering, work schedules, HR requests, and QR attendance.

The app is configured as version `1.0.4` with Android `versionCode` `6`. The
latest release APK is available from the
[GitHub Releases page](https://github.com/lethanh2006/Nrapp/releases/latest).

## Product areas

- Email/password registration and two-step OTP login.
- Google sign-in, refresh-token session recovery, and account settings.
- User directory and profile management.
- Realtime one-to-one chat through REST and Socket.IO, including supported image
  uploads.
- Task creation, assignment, filtering, status changes, and personal task views.
- Canteen menu browsing, table orders, order history, and admin menu/order/table
  management. The current order contract supports cash payment.
- Monthly work schedules, leave/late/overtime and related work requests, policy
  management, reports, and QR attendance.

Admin and user navigation are separated in the Expo Router tree. Backend
authorization remains authoritative; hiding a screen in the app is not a
permission check.

## Source layout

```text
app/
├── (auth)/                 # register, login, OTP verification
└── (main)/
    ├── admin/              # admin navigation and screens
    └── user/               # user navigation and screens

src/features/<feature>/
├── admin/                  # admin screens, UI, and hooks
├── user/                   # user screens and UI
└── shared/                 # role-neutral model or utilities only

src/services/               # REST and Socket.IO clients plus domain types
src/application/            # roles, access checks, and route constants
src/shared/                 # genuinely cross-feature UI, hooks, and models
src/utils/                  # Axios, Gateway URL, and HTTP error helpers
```

The ESLint configuration enforces the admin/user/shared import boundaries. Keep
business calls in `src/services`, keep route files thin, and do not move a
role-specific screen into `shared`.

## Configuration

Copy `.env.example` to `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_GATEWAY_HOST:3000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Optional settings are `EXPO_PUBLIC_API_TIMEOUT_MS`,
`EXPO_PUBLIC_SOCKET_URL`, `EXPO_PUBLIC_SOCKET_PATH`, `EXPO_PUBLIC_API_PORT`, and
`EXPO_PUBLIC_API_PATH`. `EXPO_PUBLIC_*` values are bundled into the client and
must contain public configuration only; never put a secret in them.

Use a Gateway URL reachable from the device. Android Emulator can use
`10.0.2.2` only through the fallback host/port settings when a full API URL is
not provided. A physical device needs a Gateway address reachable over the LAN
or tunnel.

## Local development

```bash
npm ci
cp .env.example .env.local
npm start
```

Available scripts:

```bash
npm run android
npm run android:lan
npm run android:tunnel
npm run ios
npm run web
npm run lint
npx tsc --noEmit
```

`npm run reset-project` is the Expo starter script and should not be run on the
developed source tree.

## EAS builds and updates

The build profiles in `eas.json` are:

- `preview`: internal Android APK for device testing.
- `production`: Android App Bundle for store distribution.
- `production-apk`: production-channel APK for internal distribution.

For example:

```bash
eas build --platform android --profile preview
eas build --platform android --profile production
```

The `eas-update.yml` workflow runs on pushes to `main` and manual dispatches. It
requires the `EXPO_TOKEN` repository secret, installs dependencies, runs ESLint
and TypeScript checks, then publishes an Android update to the `production`
channel. The app checks for updates on launch and falls back to the cached bundle
when an update is not immediately available.
