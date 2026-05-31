// JavaScript wrapper around the Android DeviceAdmin native module.
import { NativeModules, Platform } from "react-native";

const { DeviceAdminModule } = NativeModules;

const ensureAndroidModule = () => {
  if (Platform.OS !== "android" || !DeviceAdminModule) {
    throw new Error("Device Admin is only available on Android");
  }
};

export const isDeviceAdminActive = async () => {
  ensureAndroidModule();
  return DeviceAdminModule.isDeviceAdminActive();
};

export const isDeviceOwner = async () => {
  ensureAndroidModule();
  return DeviceAdminModule.isDeviceOwner();
};

export const requestDeviceAdmin = async () => {
  ensureAndroidModule();
  return DeviceAdminModule.requestDeviceAdmin();
};

export const lockScreen = async () => {
  ensureAndroidModule();
  return DeviceAdminModule.lockScreen();
};

export const startLockService = async () => {
  ensureAndroidModule();
  return DeviceAdminModule.startLockService();
};
