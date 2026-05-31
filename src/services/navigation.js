// Shared navigation ref so background FCM handlers can request screen changes safely.
import React from "react";

export const navigationRef = React.createRef();

export const navigateSafely = (routeName, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(routeName, params);
  }
};
