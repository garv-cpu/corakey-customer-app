// App entrypoint; registers background FCM handling before React renders.
import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import messaging from "@react-native-firebase/messaging";
import App from "./src/App";
import { handleLockCommand } from "./src/services/fcmService";

const appName = "CoraCustomerApp";

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await handleLockCommand(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
