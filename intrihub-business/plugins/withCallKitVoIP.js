const { withInfoPlist, withXcodeProject } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to enable iOS PushKit (VoIP) and CallKit for IntriHub Business.
 * Required for full-screen incoming order ringing alerts even when phone is locked or app is closed.
 */
const withCallKitVoIP = (config) => {
  // 1. Add 'voip' and 'audio' to UIBackgroundModes in Info.plist
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }

    const modes = config.modResults.UIBackgroundModes;
    if (!modes.includes("remote-notification")) {
      modes.push("remote-notification");
    }
    if (!modes.includes("voip")) {
      modes.push("voip");
    }
    if (!modes.includes("audio")) {
      modes.push("audio");
    }

    config.modResults.NSVoIPUsageDescription =
      "IntriHub Business receives VoIP alerts to ring your device full-screen for urgent incoming customer orders.";

    return config;
  });

  // 2. Link CallKit and PushKit frameworks in Xcode Project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    try {
      xcodeProject.addFramework("CallKit.framework");
      xcodeProject.addFramework("PushKit.framework");
      xcodeProject.addFramework("AVFoundation.framework");
    } catch (e) {
      console.warn("[withCallKitVoIP] Warning adding frameworks:", e.message);
    }

    return config;
  });

  return config;
};

module.exports = withCallKitVoIP;
