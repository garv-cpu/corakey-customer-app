// Root navigator; chooses enrollment, home, or forced lock screen from persisted state.
import React from "react";
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
  );
}
