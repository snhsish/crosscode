module.exports = ({ config }) => {
  const buildProfile = process.env.EAS_BUILD_PROFILE;

  config.plugins = [
    ...(config.plugins || []),
    "expo-image",
    "expo-router",
    "expo-status-bar",
  ];

  if (buildProfile === 'development') {
    config.name = 'CrossCode Dev';
    config.slug = 'crosscode-dev';
    config.scheme = 'crosscode-dev';
    
    if (config.android) {
      config.android.package = 'com.snehasishkun.crosscode.dev';
    }
    
    if (config.ios) {
      config.ios.bundleIdentifier = 'com.snehasishkun.crosscode.dev';
    }
  }
  
  return config;
};
