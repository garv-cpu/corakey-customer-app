// Native module exposing Device Owner, provisioning, IMEI, and lock APIs to JavaScript.
package com.emilockercustomer;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.UserManager;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.TelephonyManager;
import androidx.core.content.ContextCompat;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.json.JSONObject;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class DeviceAdminModule extends ReactContextBaseJavaModule {
    private static final String PREFS = "emi_prefs";
    private static final String LOG_TAG = "EMILocker";
    private static final String PROVISIONING_FILE = "emi_provisioning.json";
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
            String source = "shared_preferences";
            String customerId = prefs.getString("customerId", "");
            String retailerId = prefs.getString("retailerId", "");
            String enrollmentKey = prefs.getString("enrollmentKey", "");
            String backendUrl = prefs.getString("backendUrl", "");
            boolean provisioningComplete = prefs.getBoolean("provisioning_complete", false);
            long provisioningTimestamp = prefs.getLong("provisioning_timestamp", 0L);

            if (customerId == null || customerId.isEmpty()) {
                File file = new File(reactContext.getFilesDir(), PROVISIONING_FILE);
                if (file.exists()) {
                    String raw = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
                    JSONObject json = new JSONObject(raw);
                    source = "json_file";
                    customerId = json.optString("customerId", "");
                    retailerId = json.optString("retailerId", "");
                    enrollmentKey = json.optString("enrollmentKey", "");
                    backendUrl = json.optString("backendUrl", "");
                    provisioningComplete = json.optBoolean("provisioningComplete", json.optBoolean("provisioning_complete", false));
                    provisioningTimestamp = json.optLong("provisioning_timestamp", 0L);
                }
            }

            android.util.Log.d(LOG_TAG, "Provisioning data source: " + source);
            android.util.Log.d(LOG_TAG, "customerId found: " + (customerId != null && !customerId.isEmpty()));

            WritableMap map = Arguments.createMap();
            map.putString("customerId", customerId != null ? customerId : "");
            map.putString("retailerId", retailerId != null ? retailerId : "");
            map.putString("enrollmentKey", enrollmentKey != null ? enrollmentKey : "");
            map.putString("backendUrl", backendUrl != null ? backendUrl : "");
            map.putBoolean("provisioningComplete", provisioningComplete);
            map.putString("source", source);
            map.putDouble("provisioningTimestamp", provisioningTimestamp);
            promise.resolve(map);
        } catch (Exception error) {
            WritableMap map = Arguments.createMap();
            map.putString("customerId", "");
            map.putString("retailerId", "");
            map.putString("enrollmentKey", "");
            map.putString("backendUrl", "");
            map.putBoolean("provisioningComplete", false);
            map.putString("source", "none");
            promise.resolve(map);
        }
    }

    @ReactMethod
    public void clearProvisioningFile(Promise promise) {
        try {
            File file = new File(reactContext.getFilesDir(), PROVISIONING_FILE);
            boolean deleted = !file.exists() || file.delete();
            promise.resolve(deleted);
        } catch (Exception error) {
            promise.reject("PROVISIONING_FILE_CLEAR_FAILED", error);
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

    @ReactMethod
    public void applyDeviceOwnerPolicies(Promise promise) {
        try {
            DevicePolicyManager dpm = getDevicePolicyManager();
            ComponentName adminComponent = getAdminComponent();

            if (!dpm.isDeviceOwnerApp(reactContext.getPackageName())) {
                promise.reject("NOT_DEVICE_OWNER", "CORA is not device owner");
                return;
            }

            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_REMOVE_USER);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_DEBUGGING_FEATURES);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_PRIVATE_DNS);
            }

            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("POLICY_APPLY_FAILED", error);
        }
    }

    private DevicePolicyManager getDevicePolicyManager() {
        return (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
    }

    private ComponentName getAdminComponent() {
        return new ComponentName(reactContext, DeviceAdminReceiver.class);
    }
}
