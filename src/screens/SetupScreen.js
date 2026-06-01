// One-time setup after Android Device Owner provisioning completes.
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, NativeModules, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setBackendUrl } from "../services/api";
import { getFcmToken, initializeFcm } from "../services/fcmService";
import { navigationRef } from "../services/navigation";
import { applyDeviceOwnerPolicies, startLockService } from "../services/deviceAdmin";
import { saveCustomer, saveFcmToken, saveRegistered } from "../utils/storage";

const { DeviceAdminModule } = NativeModules;

const SETUP_STEPS = [
  "Loading provisioning data...",
  "Reading device info...",
  "Connecting to server...",
  "Registering device...",
  "Applying security policies...",
  "Finalizing setup..."
];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function SetupScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const setupRan = useRef(false);

  const addLog = msg => {
    console.log("[SetupScreen]", msg);
    setLogs(prev => [...prev, msg]);
  };

  const logToBackend = async (step, data = {}) => {
    try {
      await api.post("/devices/setup-log", {
        step,
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.warn("[SetupScreen] backend log failed:", logError.message);
    }
  };

  const runSetup = async () => {
    if (setupRan.current) return;
    setupRan.current = true;

    let provData = null;

    try {
      setError(null);
      setCurrentStep(0);
      addLog("Loading provisioning data from device...");

      await wait(500);
      provData = await DeviceAdminModule.getProvisioningData();

      if (provData?.backendUrl) {
        setBackendUrl(provData.backendUrl);
      }

      addLog(`Provisioning data: ${JSON.stringify({
        hasCustomerId: Boolean(provData?.customerId),
        hasRetailerId: Boolean(provData?.retailerId),
        hasEnrollmentKey: Boolean(provData?.enrollmentKey),
        hasBackendUrl: Boolean(provData?.backendUrl),
        source: provData?.source || "unknown"
      })}`);

      await logToBackend("provisioning_data_loaded", {
        customerId: provData?.customerId || null,
        retailerId: provData?.retailerId || null,
        hasEnrollmentKey: Boolean(provData?.enrollmentKey),
        source: provData?.source || "unknown"
      });

      if (!provData?.customerId || !provData?.enrollmentKey) {
        throw new Error("Provisioning data is missing customerId or enrollmentKey");
      }

      setCurrentStep(1);
      addLog("Reading device IMEI...");

      let imei = "UNKNOWN";
      try {
        imei = await DeviceAdminModule.getIMEI() || "UNKNOWN";
        addLog(`IMEI loaded: ${imei !== "UNKNOWN" ? "yes" : "unavailable"}`);
      } catch (imeiError) {
        addLog(`IMEI unavailable (using fallback): ${imeiError.message}`);
      }

      await logToBackend("imei_loaded", {
        customerId: provData.customerId,
        imeiAvailable: imei !== "UNKNOWN"
      });

      setCurrentStep(2);
      addLog("Getting FCM token (non-blocking)...");

      let fcmToken = null;
      try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 5000));
        fcmToken = await Promise.race([getFcmToken(), timeoutPromise]);
        addLog(`FCM token: ${fcmToken ? "loaded" : "timed out - using pending"}`);
      } catch (fcmError) {
        addLog(`FCM error (using pending): ${fcmError.message}`);
      }

      const tokenToUse = fcmToken || `PENDING_FCM_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await logToBackend("fcm_token_loaded", {
        customerId: provData.customerId,
        tokenReady: Boolean(fcmToken)
      });

      setCurrentStep(3);
      addLog("Registering device with server...");

      await logToBackend("backend_register_start", {
        customerId: provData.customerId,
        retailerId: provData.retailerId,
        hasEnrollmentKey: Boolean(provData.enrollmentKey),
        imei: imei !== "UNKNOWN" ? "present" : "missing",
        fcmReady: Boolean(fcmToken)
      });

      let registerResponse = null;
      let lastRegisterError = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          addLog(`Register attempt ${attempt}/3...`);

          const response = await api.post("/devices/register", {
            customerId: provData.customerId,
            retailerId: provData.retailerId,
            enrollmentKey: provData.enrollmentKey,
            enrollmentCode: provData.enrollmentKey,
            fcmToken: tokenToUse,
            imei
          });

          registerResponse = response.data;
          addLog(`Registration SUCCESS on attempt ${attempt}`);
          break;
        } catch (registerError) {
          lastRegisterError = registerError;
          addLog(`Register attempt ${attempt} failed: ${registerError.response?.data?.message || registerError.message}`);

          if (attempt < 3) {
            addLog("Waiting 2s before retry...");
            await wait(2000);
          }
        }
      }

      if (!registerResponse?.success) {
        throw new Error(
          lastRegisterError?.response?.data?.message
          || lastRegisterError?.message
          || "Registration failed after 3 attempts"
        );
      }

      await logToBackend("backend_register_success", {
        customerId: provData.customerId
      });

      setCurrentStep(4);
      addLog("Applying security policies...");

      try {
        const isOwner = await DeviceAdminModule.isDeviceOwner();
        addLog(`Device owner status: ${isOwner}`);
        await applyDeviceOwnerPolicies();
      } catch (policyError) {
        addLog(`Policy apply skipped/failed: ${policyError.message}`);
      }

      await logToBackend("policies_applied", {
        customerId: provData.customerId
      });

      setCurrentStep(5);
      addLog("Saving local state...");

      const responseData = registerResponse.data || {};
      const device = responseData.device || responseData.deviceStatus || {};

      await AsyncStorage.multiSet([
        ["registered", "true"],
        ["customerId", responseData.customerId || provData.customerId || ""],
        ["customerName", responseData.customerName || ""],
        ["shopName", responseData.shopName || ""],
        ["emiAmount", String(responseData.overdueAmount || 0)],
        ["locked", device.isLocked ? "true" : "false"],
        ["fcmToken", tokenToUse]
      ]);

      await saveFcmToken(tokenToUse);
      await saveCustomer({
        customerId: responseData.customerId || provData.customerId,
        retailerId: provData.retailerId,
        enrollmentKey: provData.enrollmentKey,
        backendUrl: provData.backendUrl,
        customerName: responseData.customerName,
        shopName: responseData.shopName,
        retailerPhone: responseData.retailerPhone,
        overdueAmount: responseData.overdueAmount,
        imei
      });
      await saveRegistered(true);

      try {
        await DeviceAdminModule.clearProvisioningFile();
      } catch {
        // Cleanup is best effort.
      }

      await logToBackend("local_state_saved", {
        customerId: provData.customerId
      });

      addLog("Starting lock service...");
      try {
        await startLockService();
      } catch (serviceError) {
        addLog(`Lock service start failed: ${serviceError.message}`);
      }

      initializeFcm().then(async realToken => {
        if (realToken && realToken !== tokenToUse) {
          try {
            await api.post("/devices/register", {
              customerId: provData.customerId,
              enrollmentKey: provData.enrollmentKey,
              fcmToken: realToken,
              imei
            });
            await AsyncStorage.setItem("fcmToken", realToken);
            await saveFcmToken(realToken);
            addLog("FCM token updated with real token");
          } catch (tokenError) {
            console.warn("FCM token update failed:", tokenError.message);
          }
        }
      }).catch(fcmError => console.warn("FCM init background error:", fcmError.message));

      await logToBackend("lock_service_started", {
        customerId: provData.customerId
      });

      addLog("Setup complete! Launching app...");
      await wait(1000);

      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: device.isLocked ? "Lock" : "Home" }]
      });
    } catch (setupError) {
      console.error("[SetupScreen] setup failed:", setupError);
      addLog(`ERROR: ${setupError.message}`);

      await logToBackend("setup_failed", {
        customerId: provData?.customerId,
        retailerId: provData?.retailerId,
        error: setupError.message
      }).catch(() => {});

      setError(setupError.message);
    }
  };

  useEffect(() => {
    runSetup();
  }, [retryCount]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Setup needs attention</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <ScrollView style={styles.logBox}>
          {logs.map((log, index) => (
            <Text key={`${log}-${index}`} style={styles.logLine}>{log}</Text>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setError(null);
            setLogs([]);
            setupRan.current = false;
            setRetryCount(count => count + 1);
          }}
        >
          <Text style={styles.retryBtnText}>Retry Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setting up your device</Text>
      <Text style={styles.step}>{SETUP_STEPS[currentStep]}</Text>
      <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 24 }} />
      <ScrollView style={styles.logBox}>
        {logs.map((log, index) => (
          <Text key={`${log}-${index}`} style={styles.logLine}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8
  },
  step: {
    color: "#94a3b8",
    fontSize: 15
  },
  logBox: {
    marginTop: 24,
    maxHeight: 220,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 8
  },
  logLine: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 18
  },
  errorMsg: {
    color: "#fca5a5",
    fontSize: 14,
    marginVertical: 12,
    lineHeight: 20
  },
  retryBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16
  },
  retryBtnText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16
  }
});
