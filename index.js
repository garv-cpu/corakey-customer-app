// App entrypoint; registers background FCM handling before React renders.
import { setJSExceptionHandler, setNativeExceptionHandler } from "react-native-exception-handler";
import "react-native-gesture-handler";
import { AppRegistry } from "react-native";
import messaging from "@react-native-firebase/messaging";
import App from "./src/App";
import { handleLockCommand } from "./src/services/fcmService";

setNativeExceptionHandler(errorString => {
  const RNFS = require("react-native-fs");
  RNFS.writeFile(
    `${RNFS.ExternalDirectoryPath}/emi_crash.txt`,
    `${new Date().toISOString()}\n${errorString}`,
    "utf8"
  );
}, false);

setJSExceptionHandler((error, _isFatal) => {
  const RNFS = require("react-native-fs");
  RNFS.writeFile(
    `${RNFS.ExternalDirectoryPath}/emi_js_crash.txt`,
    `${new Date().toISOString()}\n${error.message}\n${error.stack}`,
    "utf8"
  );
}, true);

const appName = "CoraCustomerApp";

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await handleLockCommand(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
