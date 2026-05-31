// Native module exposing Device Owner, provisioning, IMEI, and lock APIs to JavaScript.
package com.emilockercustomer;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.TelephonyManager;
import androidx.core.content.ContextCompat;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class DeviceAdminModule extends ReactContextBaseJavaModule {
    private static final String PREFS = "emi_prefs";
    private final ReactApplicationContext reactContext;

    public DeviceAdminModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "DeviceAdminModule";
    }

    @ReactMethod
    public void lockScreen(Promise promise) {
        try {
            DevicePolicyManager dpm = getDevicePolicyManager();
            ComponentName adminComponent = getAdminComponent();

            if (!dpm.isAdminActive(adminComponent)) {
                promise.reject("DEVICE_ADMIN_INACTIVE", "Device Admin permission is not active");
                return;
            }

            dpm.lockNow();
            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("LOCK_FAILED", error);
        }
    }

    @ReactMethod
    public void isDeviceAdminActive(Promise promise) {
        try {
            DevicePolicyManager dpm = getDevicePolicyManager();
            promise.resolve(dpm.isAdminActive(getAdminComponent()));
        } catch (Exception error) {
            promise.reject("ADMIN_CHECK_FAILED", error);
        }
    }

    @ReactMethod
    public void isDeviceOwner(Promise promise) {
        try {
            DevicePolicyManager dpm = getDevicePolicyManager();
            promise.resolve(dpm.isDeviceOwnerApp(reactContext.getPackageName()));
        } catch (Exception error) {
            promise.reject("DEVICE_OWNER_CHECK_FAILED", error);
        }
    }

    @ReactMethod
    public void getProvisioningData(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            WritableMap map = Arguments.createMap();
            map.putString("customerId", prefs.getString("customerId", ""));
            map.putString("retailerId", prefs.getString("retailerId", ""));
            map.putString("enrollmentKey", prefs.getString("enrollmentKey", ""));
            map.putString("backendUrl", prefs.getString("backendUrl", ""));
            map.putBoolean("provisioningComplete", prefs.getBoolean("provisioning_complete", false));
            promise.resolve(map);
        } catch (Exception error) {
            promise.reject("PROVISIONING_DATA_FAILED", error);
        }
    }

    @ReactMethod
    public void getIMEI(Promise promise) {
        try {
            if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                promise.resolve("UNKNOWN");
                return;
            }

            TelephonyManager telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager == null) {
                promise.resolve("UNKNOWN");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                String imei = telephonyManager.getImei();
                promise.resolve(imei != null ? imei : "UNKNOWN");
            } else {
                String deviceId = telephonyManager.getDeviceId();
                promise.resolve(deviceId != null ? deviceId : "UNKNOWN");
            }
        } catch (Exception error) {
            promise.resolve("UNKNOWN");
        }
    }

    @ReactMethod
    public void requestDeviceAdmin(Promise promise) {
        try {
            Activity activity = getCurrentActivity();

            if (activity == null) {
                promise.reject("NO_ACTIVITY", "Cannot open Device Admin dialog without an active Activity");
                return;
            }

            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, getAdminComponent());
            intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "CORA needs this permission to lock the financed phone if EMI payments become overdue."
            );
            activity.startActivity(intent);
            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("ADMIN_REQUEST_FAILED", error);
        }
    }

    @ReactMethod
    public void startLockService(Promise promise) {
        try {
            Intent intent = new Intent(reactContext, LockForegroundService.class);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent);
            } else {
                reactContext.startService(intent);
            }

            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("SERVICE_START_FAILED", error);
        }
    }

    private DevicePolicyManager getDevicePolicyManager() {
        return (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
    }

    private ComponentName getAdminComponent() {
        return new ComponentName(reactContext, DeviceAdminReceiver.class);
    }
}
