// FCM setup and shared lock/unlock command handling.
import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import api from "./api";
import { lockScreen } from "./deviceAdmin";
import { clearLockState, getCustomer, getFcmToken as getStoredFcmToken, saveFcmToken, saveLockState } from "../utils/storage";
import { navigateSafely } from "./navigation";

const requestNotificationPermission = async () => {
  if (Platform.OS === "android" && Platform.Version >= 33) {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  await messaging().requestPermission();
};

const registerTokenWithBackend = async token => {
  const customer = await getCustomer();

  if (!customer?.customerId && !customer?.enrollmentCode) {
    return;
  }

  const payload = {
    fcmToken: token,
    imei: customer.imei || "UNKNOWN"
  };

  if (customer.customerId) {
    payload.customerId = customer.customerId;
    payload.retailerId = customer.retailerId;
    payload.enrollmentKey = customer.enrollmentKey;
  } else {
    payload.enrollmentCode = customer.enrollmentCode;
  }

  await api.post("/devices/register", payload);
};

export const getFcmToken = async () => {
  try {
    await requestNotificationPermission();
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    console.warn("[FCM] getFcmToken failed:", error.message);
    return null;
  }
};

export const handleLockCommand = async remoteMessage => {
  const action = remoteMessage?.data?.action;

  if (action === "LOCK") {
    await saveLockState("LOCKED");
    navigateSafely("Lock");

    try {
      await lockScreen();
    } catch (error) {
      console.warn("System lock failed", error);
    }
  }

  if (action === "UNLOCK") {
    await clearLockState();
    navigateSafely("Home");
  }
};

export const initializeFcm = async () => {
  const token = await getFcmToken();
  const previousToken = await getStoredFcmToken();

  if (token && token !== previousToken) {
    await saveFcmToken(token);
    try {
      await registerTokenWithBackend(token);
    } catch (error) {
      console.warn("FCM token registration failed", error);
    }
  }

  messaging().onTokenRefresh(async refreshedToken => {
    await saveFcmToken(refreshedToken);
    try {
      await registerTokenWithBackend(refreshedToken);
    } catch (error) {
      console.warn("FCM token refresh registration failed", error);
    }
  });

  messaging().onMessage(async remoteMessage => {
    await handleLockCommand(remoteMessage);
  });

  return token;
};
