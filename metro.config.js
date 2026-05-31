// Metro config for Expo bare workflow; extends Expo's defaults as required by expo-doctor.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
