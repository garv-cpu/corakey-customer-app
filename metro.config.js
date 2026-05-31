// Metro config for Expo bare workflow. Keep Expo asset handling while extending
// React Native's Metro config shape required by newer RN versions.
const { getDefaultConfig: getExpoDefaultConfig } = require("expo/metro-config");
const { getDefaultConfig: getReactNativeDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const config = mergeConfig(getReactNativeDefaultConfig(__dirname), getExpoDefaultConfig(__dirname));

module.exports = config;
