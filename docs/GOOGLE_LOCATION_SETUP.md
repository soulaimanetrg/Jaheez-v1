# Google Location Setup

Jaheez uses two separate Google credentials:

1. `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` renders the Android map. Restrict it to Android application `com.jaheez.user` and the debug/release signing certificate fingerprints. Enable Maps SDK for Android.
2. `GOOGLE_MAPS_SERVER_API_KEY` is backend-only. Restrict it to backend egress IP addresses and enable the Geocoding API and Places API (New). Never add it to Expo configuration.

Backend runtime configuration:

```env
GOOGLE_MAPS_SERVER_API_KEY=
DEFAULT_MAP_LATITUDE=
DEFAULT_MAP_LONGITUDE=
```

User-app build configuration:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Address search and reverse geocoding fail closed when the backend key is absent. The client never invents an address or displays raw coordinates as an address.

ModernMT is also server-only:

```env
MODERNMT_API_KEY=
```

The mobile app calls the authenticated Jaheez translation endpoint. Never use an `EXPO_PUBLIC_` ModernMT key.
