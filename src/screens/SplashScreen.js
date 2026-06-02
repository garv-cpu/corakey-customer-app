// First screen; routes based on provisioning, registration, and lock state.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

const { DeviceAdminModule } = NativeModules;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const getSafeProvisioningData = async () => {
  if (!DeviceAdminModule?.getProvisioningData) {
    return { provisioningComplete: false, source: "native_module_missing" };
  }

  return DeviceAdminModule.getProvisioningData();
};

export default function SplashScreen({ navigation }) {
  const [message, setMessage] = useState("Starting EMI Locker");

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const registered = await AsyncStorage.getItem("registered");
        const legacyRegistered = await AsyncStorage.getItem("cora.registered");
        const customerId = await AsyncStorage.getItem("customerId");
        const legacyCustomerRaw = await AsyncStorage.getItem("cora.customer");
        const legacyCustomer = legacyCustomerRaw ? JSON.parse(legacyCustomerRaw) : null;

        if ((registered === "true" || legacyRegistered === "true") && (customerId || legacyCustomer?.customerId)) {
          const locked = await AsyncStorage.getItem("locked");
          const legacyLocked = await AsyncStorage.getItem("cora.lockState");

          if (locked === "true" || legacyLocked === "LOCKED") {
            navigation.replace("Lock");
          } else {
            navigation.replace("Home");
          }
          return;
        }

        setMessage("Checking provisioning data");
        await wait(800);

        const provisioningData = await getSafeProvisioningData();
        console.log("[SplashScreen] provisioning data:", JSON.stringify(provisioningData));

        if (provisioningData?.provisioningComplete === true || provisioningData?.provisioningComplete === "true") {
          navigation.replace("Setup");
          return;
        }

        setMessage("Waiting for provisioning data");
        await wait(2000);

        const retryData = await getSafeProvisioningData();
        console.log("[SplashScreen] retry provisioning data:", JSON.stringify(retryData));

        if (retryData?.provisioningComplete === true || retryData?.provisioningComplete === "true") {
          navigation.replace("Setup");
          return;
        }

        navigation.replace("Setup");
      } catch (error) {
        console.error("[SplashScreen] error:", error);
        navigation.replace("Setup");
      }
    };

    checkAppState();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#22c55e" size="large" />
      <Text style={styles.title}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    padding: 24
  },
  title: {
    marginTop: 18,
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "800"
  }
});
