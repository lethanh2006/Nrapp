# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## API configuration

Copy `.env.example` to `.env.local`, then set `EXPO_PUBLIC_API_URL` to the
backend API URL. Restart Expo after changing environment variables.

API hosts, clients, timeouts, socket settings, and endpoint paths are kept in:

- `constants/api.ts`: environment-based API and socket configuration
- `services/api.ts`: shared Axios clients and endpoint definitions
- `services/auth.ts`: typed auth requests and session persistence
- `services/user.ts`: typed user and admin requests
- `services/chat.ts`: typed chat and message requests

Authenticated gateway requests receive the stored Bearer token through the
shared Axios interceptor. Screens should call these service modules instead of
building paths, headers, or payloads locally.

Chat messages are sent as multipart data so the same endpoint supports text,
an image, or both. The gateway forwards images to the chat service for
Cloudinary upload. Socket.IO authenticates with the stored JWT and is available
through the gateway proxy by default; set `EXPO_PUBLIC_SOCKET_URL` separately
only when the chat socket service is exposed on another origin.

In development, the app can infer the Expo host when `EXPO_PUBLIC_API_URL` is
not set. Production builds require `EXPO_PUBLIC_API_URL`.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
