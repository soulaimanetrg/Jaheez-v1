# Run JAHEEZ

Open separate PowerShell terminals.

## Node Version

Use Node 20 LTS. Node 24 can break Expo/React Native tooling.

Check:

```powershell
node -v
```

## Backend

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1
npm.cmd run dev --prefix backend
```

Backend runs on:

```text
http://localhost:3002
```

## User App

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\user-app
npx expo start -c
```

## Driver App

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\driver-app
npx expo start -c
```

## Admin

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1\frontend\admin
npm.cmd run dev
```

Admin runs on:

```text
http://localhost:3000
```

## Optional Redis

```powershell
cd C:\Users\user\Desktop\jaheeez\Jaheez-v1
npm.cmd run redis:docker
```

## If Expo Fails

Run Expo only inside:

```text
frontend/user-app
frontend/driver-app
```

Use:

```powershell
npx expo start -c
```
