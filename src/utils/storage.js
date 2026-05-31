// AsyncStorage helpers for enrollment, FCM token, and lock state.
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  customer: "cora.customer",
  fcmToken: "cora.fcmToken",
  lockState: "cora.lockState",
  registered: "cora.registered"
};

export const saveCustomer = async customer => {
  await AsyncStorage.setItem(KEYS.customer, JSON.stringify(customer));
};

export const getCustomer = async () => {
  const raw = await AsyncStorage.getItem(KEYS.customer);
  return raw ? JSON.parse(raw) : null;
};

export const saveFcmToken = async token => {
  await AsyncStorage.setItem(KEYS.fcmToken, token);
};

export const getFcmToken = async () => AsyncStorage.getItem(KEYS.fcmToken);

export const saveLockState = async state => {
  await AsyncStorage.setItem(KEYS.lockState, state);
};

export const getLockState = async () => AsyncStorage.getItem(KEYS.lockState);

export const clearLockState = async () => {
  await AsyncStorage.removeItem(KEYS.lockState);
};

export const saveRegistered = async registered => {
  await AsyncStorage.setItem(KEYS.registered, registered ? "true" : "false");
};

export const isRegistered = async () => {
  const value = await AsyncStorage.getItem(KEYS.registered);
  return value === "true";
};
