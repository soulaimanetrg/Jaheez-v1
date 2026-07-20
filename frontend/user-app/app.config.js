const base = require('./app.json').expo;

module.exports = () => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  return {
    ...base,
    plugins: Array.from(new Set([...(base.plugins || []), 'expo-localization'])),
    android: {
      ...base.android,
      ...(mapsKey ? { config: { googleMaps: { apiKey: mapsKey } } } : {}),
    },
  };
};
