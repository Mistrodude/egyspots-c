/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId:   'com.egyspots.app',
  appName: 'EgySpots',
  webDir:  'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for live reload during development:
    // url: 'http://YOUR_LAN_IP:5173',
    // cleartext: true,
  },
  plugins: {
    Geolocation: {},
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0D0B14',
      showSpinner: false,
    },
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: false,
  },
};

module.exports = config;
