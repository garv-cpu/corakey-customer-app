// Reads Android Device Owner provisioning data from the native SharedPreferences bridge.
import { NativeModules, Platform } from "react-native";

const { DeviceAdminModule } = NativeModules;

export const getProvisioningData = async () => {
  if (Platform.OS !== "android" || !DeviceAdminModule?.getProvisioningData) {
    return { provisioningComplete: false };
  }

  return DeviceAdminModule.getProvisioningData();
};

export const getIMEI = async () => {
  if (Platform.OS !== "android" || !DeviceAdminModule?.getIMEI) {
    return "UNKNOWN";
  }

  return DeviceAdminModule.getIMEI();
};
