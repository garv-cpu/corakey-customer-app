// One-time setup after Android Device Owner provisioning completes.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import messaging from "@react-native-firebase/messaging";
import api, { setBackendUrl } from "../services/api";
import { initializeFcm } from "../services/fcmService";
import { startLockService } from "../services/deviceAdmin";
import { getIMEI, getProvisioningData } from "../services/provisioningService";
import { saveCustomer, saveFcmToken, saveRegistered } from "../utils/storage";

export default function SetupScreen({ navigation }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const registerDevice = async () => {
    try {
      setError("");
      setLoading(true);
      const provisioningData = await getProvisioningData();

      if (!provisioningData?.provisioningComplete) {
        throw new Error("Provisioning data is missing");
      }

      setBackendUrl(provisioningData.backendUrl);
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();
      const imei = await getIMEI();

      const response = await api.post("/api/devices/register", {
        customerId: provisioningData.customerId,
        retailerId: provisioningData.retailerId,
        enrollmentKey: provisioningData.enrollmentKey,
        fcmToken,
        imei
      });

      const data = response.data.data;
      await saveFcmToken(fcmToken);
      await saveCustomer({
        customerId: data.customerId || provisioningData.customerId,
        retailerId: provisioningData.retailerId,
        enrollmentKey: provisioningData.enrollmentKey,
        backendUrl: provisioningData.backendUrl,
        customerName: data.customerName,
        shopName: data.shopName,
        retailerPhone: data.retailerPhone,
        overdueAmount: data.overdueAmount,
        imei
      });
      await saveRegistered(true);
      await startLockService();
      await initializeFcm();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (setupError) {
      setError(setupError.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    registerDevice();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.icon}><Text style={styles.iconText}>EMI</Text></View>
      <Text style={styles.title}>Setting up your device...</Text>
      {loading ? <ActivityIndicator color="#22c55e" size="large" /> : null}
      {error ? (
        <>
          <Text style={styles.error}>{error}. Contact your retailer if this persists.</Text>
          <TouchableOpacity style={styles.button} onPress={registerDevice}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: 24
  },
  icon: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    marginBottom: 22
  },
  iconText: {
    color: "#22c55e",
    fontWeight: "900"
  },
  title: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20
  },
  error: {
    marginTop: 16,
    color: "#ef4444",
    textAlign: "center",
    lineHeight: 22
  },
  button: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800"
  }
});
