// Root navigator; chooses enrollment, home, or forced lock screen from persisted state.
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "./screens/SplashScreen";
import SetupScreen from "./screens/SetupScreen";
import HomeScreen from "./screens/HomeScreen";
import LockScreen from "./screens/LockScreen";
import { navigationRef } from "./services/navigation";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppErrorBoundary>
      <NavigationContainer
        ref={navigationRef}
      >
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, gestureEnabled: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Lock" component={LockScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppErrorBoundary>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Setup needs attention</Text>
        <Text style={styles.errorText}>{this.state.error.message || "The app could not start setup automatically."}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => this.setState({ error: null })}>
          <Text style={styles.errorButtonText}>Retry Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#0f172a",
    padding: 24
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12
  },
  errorText: {
    color: "#fecaca",
    fontSize: 15,
    lineHeight: 22
  },
  errorButton: {
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#22c55e",
    marginTop: 20,
    paddingVertical: 12
  },
  errorButtonText: {
    color: "#0f172a",
    fontWeight: "900"
  }
});
