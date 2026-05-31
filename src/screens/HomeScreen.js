// Minimal enrolled-state screen shown while the device is unlocked.
import React, { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getCustomer } from "../utils/storage";
import api, { setBackendUrl } from "../services/api";

export default function HomeScreen() {
  const [customer, setCustomer] = useState(null);
  const [nextEmi, setNextEmi] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const savedCustomer = await getCustomer();
        setCustomer(savedCustomer);

        if (savedCustomer?.backendUrl) {
          setBackendUrl(savedCustomer.backendUrl);
        }

        if (savedCustomer?.customerId) {
          try {
            const response = await api.get(`/api/emis/${savedCustomer.customerId}`);
            const pendingEmi = response.data.data.find(emi => emi.status !== "paid");
            setNextEmi(pendingEmi || null);
          } catch (error) {
            setNextEmi(null);
          }
        }
      };

      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>✓ Device Active</Text>
      <Text style={styles.title}>{customer?.customerName || "Customer"}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Shop</Text>
        <Text style={styles.value}>{customer?.shopName || "Retailer"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Next EMI</Text>
        <Text style={styles.value}>
          {nextEmi ? `Rs. ${nextEmi.amount} due ${new Date(nextEmi.dueDate).toLocaleDateString()}` : "No pending EMI found"}
        </Text>
      </View>
      <Text style={styles.message}>Pay your EMI on time to keep your device unlocked.</Text>
      {customer?.retailerPhone ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${customer.retailerPhone}`)}>
          <Text style={styles.footer}>Call retailer: {customer.retailerPhone}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f7fafc",
    padding: 24
  },
  status: {
    color: "#16885d",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8
  },
  title: {
    color: "#0b1117",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 28
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: "#dce3ea",
    paddingVertical: 16
  },
  label: {
    color: "#667381",
    fontSize: 13,
    marginBottom: 4
  },
  value: {
    color: "#101923",
    fontSize: 18,
    fontWeight: "700"
  },
  message: {
    marginTop: 24,
    color: "#475569",
    fontSize: 15,
    lineHeight: 22
  },
  footer: {
    marginTop: 34,
    color: "#0f172a",
    fontWeight: "800"
  }
});
