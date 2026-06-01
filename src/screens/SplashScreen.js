// First screen; routes based on provisioning, registration, and lock state.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getLockState, isRegistered } from "../utils/storage";
import { getProvisioningData } from "../services/provisioningService";

export default function SplashScreen({ navigation }) {
  const [waiting, setWaiting] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    const route = async () => {
      const [registered, lockState, provisioningData] = await Promise.all([
        isRegistered(),
        getLockState(),
        getProvisioningData()
      ]);

      setTimeout(() => {
        if (registered && lockState === "LOCKED") {
          navigation.reset({ index: 0, routes: [{ name: "Lock" }] });
          return;
        }

        if (registered) {
          navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          return;
        }

        const hasProvisioningData = Boolean(
          provisioningData?.provisioningComplete
          && provisioningData?.customerId
          && provisioningData?.enrollmentKey
          && provisioningData?.backendUrl
        );
        setSetupAvailable(hasProvisioningData);

        if (hasProvisioningData) {
          navigation.reset({ index: 0, routes: [{ name: "Setup" }] });
          return;
        }

        setWaiting(true);
      }, 800);
    };

    route();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#22c55e" size="large" />
      <Text style={styles.title}>{waiting ? "Waiting for enrollment" : "Starting EMI Locker"}</Text>
      {waiting && setupAvailable ? (
        <TouchableOpacity style={styles.button} onPress={() => navigation.reset({ index: 0, routes: [{ name: "Setup" }] })}>
          <Text style={styles.buttonText}>Continue Setup</Text>
        </TouchableOpacity>
      ) : null}
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
  },
  button: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "900"
  }
});
