// Cấu hình chuẩn của Expo SDK 54. babel-preset-expo tự thêm plugin của
// Reanimated/Worklets khi các gói này được cài, nên không khai báo thủ công.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
