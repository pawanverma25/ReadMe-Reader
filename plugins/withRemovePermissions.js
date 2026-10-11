const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo Config Plugin to completely strip legacy storage & media permissions.
 * Dependencies like expo-file-system and expo-image inject READ_EXTERNAL_STORAGE
 * and WRITE_EXTERNAL_STORAGE into their AAR manifests.
 * Declaring them with tools:node="remove" forces Android Gradle ManifestMerger
 * to remove them from the final release APK/AAB bundle.
 */
module.exports = function withRemovePermissions(config) {
  const permissionsToRemove = [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.READ_MEDIA_IMAGES',
    'android.permission.READ_MEDIA_VIDEO',
    'android.permission.READ_MEDIA_AUDIO',
    'READ_EXTERNAL_STORAGE',
    'WRITE_EXTERNAL_STORAGE',
    'READ_MEDIA_IMAGES',
    'READ_MEDIA_VIDEO',
    'READ_MEDIA_AUDIO',
  ];

  if (config.android && Array.isArray(config.android.permissions)) {
    config.android.permissions = config.android.permissions.filter(
      (perm) => !permissionsToRemove.includes(perm)
    );
  }

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest) return config;

    // Ensure tools namespace is declared on <manifest>
    if (!manifest.$) {
      manifest.$ = {};
    }
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissionsToRemove = [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
    ];

    // Filter out existing standard entries for these permissions
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      (perm) => !permissionsToRemove.includes(perm.$?.['android:name'])
    );

    // Add tools:node="remove" for each targeted permission
    for (const perm of permissionsToRemove) {
      manifest['uses-permission'].push({
        $: {
          'android:name': perm,
          'tools:node': 'remove',
        },
      });
    }

    return config;
  });
};
