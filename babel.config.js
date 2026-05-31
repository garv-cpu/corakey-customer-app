// Babel config for Expo bare React Native.
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"]
  };
};
