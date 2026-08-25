module.exports = ({ config }) => {
  const buildProfile = process.env.EAS_BUILD_PROFILE;

  // Tree-shake expo-router's unused native-tabs Material Symbols font (~934 KB).
  // Set here so it applies during EAS builds too.
  process.env.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD = "1";

  config.plugins = [
    ...(config.plugins || []),
    "expo-image",
    "expo-router",
    "expo-status-bar",
    [
      "react-native-android-widget",
      {
        widgets: [
          {
            name: "SmallWidget",
            label: "CrossCode Status",
            description: "Connection status and active session",
            minWidth: "110dp",
            minHeight: "40dp",
            targetCellWidth: 2,
            targetCellHeight: 1,
            resizeMode: "horizontal",
          },
          {
            name: "MediumWidget",
            label: "CrossCode Session",
            description: "Session status, today's usage and 7-day chart",
            minWidth: "250dp",
            minHeight: "110dp",
            targetCellWidth: 4,
            targetCellHeight: 2,
            resizeMode: "horizontal|vertical",
          },
          {
            name: "LargeWidget",
            label: "CrossCode Projects",
            description: "Per-project usage with mini charts",
            minWidth: "250dp",
            minHeight: "180dp",
            targetCellWidth: 4,
            targetCellHeight: 3,
            resizeMode: "horizontal|vertical",
          },
        ],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["arm64-v8a"],
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
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
