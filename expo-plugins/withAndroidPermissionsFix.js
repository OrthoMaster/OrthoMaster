const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidPermissionsFix(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // 1. Thêm namespace tools để có thể dùng tools:node="remove"
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // 2. Danh sách các quyền Google Play đang soi
    const permissionsToRemove = [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_MEDIA_AUDIO",
    ];

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    // 3. Ép buộc thêm lệnh remove
    permissionsToRemove.forEach((perm) => {
      // Kiểm tra xem quyền đã có trong mảng chưa
      const index = manifest["uses-permission"].findIndex(
        (p) => p.$["android:name"] === perm
      );

      if (index > -1) {
        // Nếu đã có, đè thuộc tính remove lên
        manifest["uses-permission"][index].$["tools:node"] = "remove";
      } else {
        // Nếu chưa có, thêm mới với lệnh remove
        manifest["uses-permission"].push({
          $: {
            "android:name": perm,
            "tools:node": "remove",
          },
        });
      }
    });

    return config;
  });
};