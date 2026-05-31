// One-time setup after Android Device Owner provisioning completes.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import messaging from "@react-native-firebase/messaging";
import api, { setBackendUrl } from "../services/api";
import { initializeFcm } from "../services/fcmService";
import { applyDeviceOwnerPolicies, startLockService } from "../services/deviceAdmin";
import { getIMEI, getProvisioningData } from "../services/provisioningService";
import { saveCustomer, saveFcmToken, saveRegistered } from "../utils/storage";

const withTimeout = (promise, timeoutMs, fallbackValue) => (
  Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallbackValue), timeoutMs))
  ])
);

const createPendingFcmToken = () => `PENDING_FCM_${Date.now()}`;

export default function SetupScreen({ navigation }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const registerDevice = async () => {
    let provisioningData = null;

    const logSetupStep = async (step, message, details) => {
      try {
        await api.post("/api/devices/setup-log", {
          step,
          message,
          details,
          customerId: provisioningData?.customerId,
          retailerId: provisioningData?.retailerId
        });
      } catch {
        // Setup logging must never block enrollment.
      }
    };

    try {
      setError("");
      setLoading(true);
      provisioningData = await getProvisioningData();

      if (!provisioningData?.provisioningComplete) {
        throw new Error("Provisioning data is missing");
      }

      setBackendUrl(provisioningData.backendUrl);
      await logSetupStep("provisioning_data_loaded", "Provisioning data loaded");

      const imei = await getIMEI();
      await logSetupStep("imei_loaded", "IMEI loaded", { hasImei: Boolean(imei && imei !== "UNKNOWN") });

      await withTimeout(messaging().registerDeviceForRemoteMessages(), 8000, false);
      const fcmToken = await withTimeout(messaging().getToken(), 10000, "");
      const registrationToken = fcmToken || createPendingFcmToken();
      await logSetupStep("fcm_token_loaded", fcmToken ? "FCM token loaded" : "FCM token timed out; using pending token");

      await logSetupStep("backend_register_start", "Registering device with backend");
      const response = await api.post("/api/devices/register", {
        customerId: provisioningData.customerId,
        retailerId: provisioningData.retailerId,
        enrollmentKey: provisioningData.enrollmentKey,
        fcmToken: registrationToken,
        imei
      });
      await logSetupStep("backend_register_success", "Backend registration succeeded");

      const data = response.data.data;
      try {
        await applyDeviceOwnerPolicies();
        await logSetupStep("policies_applied", "Device owner policies applied");
      } catch (policyError) {
        await logSetupStep("policies_failed", policyError.message || "Device owner policy apply failed");
      }

      await saveFcmToken(registrationToken);
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
      await logSetupStep("local_state_saved", "Local enrollment state saved");

      try {
        await startLockService();
        await logSetupStep("lock_service_started", "Lock foreground service started");
      } catch (serviceError) {
        await logSetupStep("lock_service_failed", serviceError.message || "Lock service failed");
      }

      try {
        await initializeFcm();
        await logSetupStep("fcm_initialized", "FCM initialized");
      } catch (fcmError) {
        await logSetupStep("fcm_initialize_failed", fcmError.message || "FCM initialize failed");
      }

      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (setupError) {
      const backendMessage = setupError.response?.data?.message;
      await logSetupStep("setup_failed", backendMessage || setupError.message || "Setup failed");
      setError(backendMessage || setupError.message || "Setup failed");
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
