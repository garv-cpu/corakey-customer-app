// First screen; routes based on provisioning, registration, and lock state.
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { getLockState, isRegistered } from "../utils/storage";
import { getProvisioningData } from "../services/provisioningService";

export default function SplashScreen({ navigation }) {
  const [waiting, setWaiting] = useState(false);

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

        if (provisioningData?.provisioningComplete) {
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
