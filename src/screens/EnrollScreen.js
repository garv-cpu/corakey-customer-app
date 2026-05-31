// Retailer enrollment screen used at point of sale.
import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import messaging from "@react-native-firebase/messaging";
import api from "../services/api";
import { requestDeviceAdmin, startLockService } from "../services/deviceAdmin";
import { saveCustomer, saveFcmToken } from "../utils/storage";

export default function EnrollScreen({ navigation }) {
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [imei, setImei] = useState("");
  const [loading, setLoading] = useState(false);

  const enroll = async () => {
    if (!enrollmentCode.trim()) {
      Alert.alert("Enrollment required", "Enter the enrollment code from the retailer dashboard.");
      return;
    }

    try {
      setLoading(true);
      await messaging().registerDeviceForRemoteMessages();
      const fcmToken = await messaging().getToken();

      const response = await api.post("/api/devices/register", {
        enrollmentCode: enrollmentCode.trim(),
        fcmToken,
        imei: imei.trim() || "UNKNOWN"
      });

      const data = response.data.data;
      const customer = {
        enrollmentCode: enrollmentCode.trim(),
        customerId: data.customerId,
        customerName: data.customerName,
        shopName: data.shopName,
        retailerPhone: data.retailerPhone,
        overdueAmount: data.overdueAmount,
        imei: imei.trim() || "UNKNOWN"
      };

      await saveCustomer(customer);
      await saveFcmToken(fcmToken);
      await requestDeviceAdmin();
      await startLockService();

      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      const message = error.response?.data?.message || "Unable to enroll this phone. Check the code and try again.";
      Alert.alert("Enrollment failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.brand}>CORA</Text>
        <Text style={styles.title}>Enroll financed phone</Text>
        <TextInput
          autoCapitalize="characters"
          placeholder="Enrollment code"
          placeholderTextColor="#7c8794"
          style={styles.input}
          value={enrollmentCode}
          onChangeText={setEnrollmentCode}
        />
        <TextInput
          keyboardType="number-pad"
          placeholder="IMEI or serial number"
          placeholderTextColor="#7c8794"
          style={styles.input}
          value={imei}
          onChangeText={setImei}
        />
        <TouchableOpacity disabled={loading} style={styles.button} onPress={enroll}>
          {loading ? <ActivityIndicator color="#081016" /> : <Text style={styles.buttonText}>Enroll Device</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0b1117",
    padding: 24
  },
  panel: {
    gap: 14
  },
  brand: {
    color: "#19c37d",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2
  },
  title: {
    color: "#f4f7fb",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#263241",
    borderRadius: 8,
    color: "#f4f7fb",
    paddingHorizontal: 14,
    backgroundColor: "#101923"
  },
  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#19c37d",
    marginTop: 8
  },
  buttonText: {
    color: "#081016",
    fontSize: 16,
    fontWeight: "800"
  }
});
