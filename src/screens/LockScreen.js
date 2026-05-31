// Fullscreen lock overlay; blocks back navigation while EMI lock is active.
import React, { useCallback, useState } from "react";
import { BackHandler, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getCustomer } from "../utils/storage";

export default function LockScreen() {
  const [customer, setCustomer] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getCustomer().then(setCustomer);
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => subscription.remove();
    }, [])
  );

  const callRetailer = () => {
    if (customer?.retailerPhone) {
      Linking.openURL(`tel:${customer.retailerPhone}`);
    }
  };

  const emergencyCall = () => {
    Linking.openURL("tel:112");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.shop}>{customer?.shopName || "CORA Finance Partner"}</Text>
      <Text style={styles.title}>Device locked</Text>
      <Text style={styles.customer}>{customer?.customerName || "Customer"}</Text>
      <Text style={styles.message}>Please pay your EMI to unlock this device.</Text>
      <Text style={styles.amount}>
        Overdue EMI: {customer?.overdueAmount ? `Rs. ${customer.overdueAmount}` : "Contact retailer"}
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={callRetailer}>
        <Text style={styles.primaryText}>Call Retailer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emergencyButton} onPress={emergencyCall}>
        <Text style={styles.emergencyText}>Emergency Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#080c10",
    padding: 24
  },
  shop: {
    color: "#19c37d",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 22
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900"
  },
  customer: {
    color: "#d9e1ea",
    fontSize: 20,
    marginTop: 8
  },
  message: {
    color: "#b5c0cc",
    fontSize: 18,
    lineHeight: 27,
    marginTop: 28
  },
  amount: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 34
  },
  primaryButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#19c37d"
  },
  primaryText: {
    color: "#081016",
    fontSize: 16,
    fontWeight: "800"
  },
  emergencyButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f87171",
    marginTop: 14
  },
  emergencyText: {
    color: "#fecaca",
    fontSize: 16,
    fontWeight: "800"
  }
});
