const { withXcodeProject, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const EXTENSION_NAME = "NotificationService";
const BUNDLE_ID_SUFFIX = ".NotificationService";

/**
 * Expo Config Plugin to add Notification Service Extension for rich iOS push notifications.
 */
const withNotificationServiceExtension = (config) => {
  // 1. Copy extension source files into ios project folder during dangerous mod phase
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(iosRoot, EXTENSION_NAME);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const sourceDir = path.join(
        config.modRequest.projectRoot,
        "targets",
        EXTENSION_NAME
      );

      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
          const srcPath = path.join(sourceDir, file);
          const destPath = path.join(targetDir, file);
          fs.copyFileSync(srcPath, destPath);
        }
      }

      return config;
    },
  ]);

  // 2. Add target to Xcode Project during withXcodeProject phase
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const bundleId = (config.ios?.bundleIdentifier || "com.intrihub.app") + BUNDLE_ID_SUFFIX;

    // Check if target already exists in project
    const existingTarget = xcodeProject.pbxTargetByName(EXTENSION_NAME);
    if (existingTarget) {
      return config;
    }

    try {
      // Create new PBXGroup and Target for the extension
      const target = xcodeProject.addTarget(
        EXTENSION_NAME,
        "app_extension",
        EXTENSION_NAME,
        bundleId
      );

      // Add files to target
      const swiftFile = path.join(EXTENSION_NAME, "NotificationService.swift");
      const plistFile = path.join(EXTENSION_NAME, "Info.plist");

      xcodeProject.addBuildPhase(
        [swiftFile],
        "PBXSourcesBuildPhase",
        "Sources",
        target.uuid
      );

      xcodeProject.addBuildPhase(
        [],
        "PBXResourcesBuildPhase",
        "Resources",
        target.uuid
      );

      // Configure build settings for extension target
      const configurations = xcodeProject.pbxXCConfigurationList();
      for (const key in configurations) {
        const configList = configurations[key];
        if (configList.buildConfigurations) {
          for (const buildConfig of configList.buildConfigurations) {
            const buildSettings = xcodeProject.pbxXCBuildConfigurationSection()[buildConfig.value]?.buildSettings;
            if (buildSettings && buildSettings.PRODUCT_NAME === `"${EXTENSION_NAME}"`) {
              buildSettings.SWIFT_VERSION = "5.0";
              buildSettings.TARGETED_DEVICE_FAMILY = `"1,2"`;
              buildSettings.INFOPLIST_FILE = `"${EXTENSION_NAME}/Info.plist"`;
              buildSettings.CODE_SIGN_STYLE = "Automatic";
              buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}"`;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[withNotificationServiceExtension] Warning adding target:", err.message);
    }

    return config;
  });

  return config;
};

module.exports = withNotificationServiceExtension;
