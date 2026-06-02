// Device Owner receiver stores provisioning extras when Android completes QR provisioning.
package com.emilockercustomer;

import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PersistableBundle;
import android.util.Log;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {
    private static final String TAG = "CoraDeviceAdmin";
    private static final String LOG_TAG = "EMILocker";
    private static final String PREFS = "emi_prefs";
    private static final String ACTION_PROVISIONING_DONE = "com.emilockercustomer.PROVISIONING_DONE";
    private static final String PROVISIONING_FILE = "emi_provisioning.json";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Log.i(TAG, "Device admin enabled");
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Log.w(TAG, "Device admin disabled");
    }

    @Override
    public void onProfileProvisioningComplete(Context context, Intent intent) {
        super.onProfileProvisioningComplete(context, intent);
        persistProvisioningExtras(context, intent);
        context.sendBroadcast(new Intent(ACTION_PROVISIONING_DONE).setPackage(context.getPackageName()));
        launchMainApp(context);
        Log.i(TAG, "Device owner provisioning complete");
    }

    public void onDeviceOwnerChanged(Context context, Intent intent) {
        persistProvisioningExtras(context, intent);
        context.sendBroadcast(new Intent(ACTION_PROVISIONING_DONE).setPackage(context.getPackageName()));
        launchMainApp(context);
        Log.i(TAG, "Device owner changed");
    }

    private void persistProvisioningExtras(Context context, Intent intent) {
        PersistableBundle extras = intent.getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);

        if (extras == null) {
            Log.w(TAG, "Provisioning extras were missing");
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
            .putString("customerId", extras.getString("customerId", ""))
            .putString("retailerId", extras.getString("retailerId", ""))
            .putString("enrollmentKey", extras.getString("enrollmentKey", ""))
            .putString("backendUrl", extras.getString("backendUrl", ""))
            .putBoolean("provisioning_complete", true)
            .putLong("provisioning_timestamp", System.currentTimeMillis())
            .apply();
        writeProvisioningFile(context, extras);
        Log.d(LOG_TAG, "Provisioning extras saved: customerId=" + extras.getString("customerId", ""));
        Log.d(LOG_TAG, "Provisioning complete flag set");
        Log.i(TAG, "Provisioning extras saved for customer=" + extras.getString("customerId", ""));
    }

    private void writeProvisioningFile(Context context, PersistableBundle extras) {
        try {
            JSONObject json = new JSONObject();
            json.put("customerId", extras.getString("customerId", ""));
            json.put("retailerId", extras.getString("retailerId", ""));
            json.put("enrollmentKey", extras.getString("enrollmentKey", ""));
            json.put("backendUrl", extras.getString("backendUrl", ""));
            json.put("provisioningComplete", true);
            json.put("provisioning_complete", true);
            json.put("provisioning_timestamp", System.currentTimeMillis());

            File file = new File(context.getFilesDir(), PROVISIONING_FILE);
            try (FileOutputStream outputStream = new FileOutputStream(file, false)) {
                outputStream.write(json.toString().getBytes(StandardCharsets.UTF_8));
            }
            Log.d(LOG_TAG, "Provisioning JSON fallback saved");
        } catch (Exception error) {
            Log.e(LOG_TAG, "Failed to save provisioning JSON fallback", error);
        }
    }

    private void launchMainApp(Context context) {
        try {
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launchIntent.putExtra("from_provisioning", true);
            context.startActivity(launchIntent);
            Log.i(TAG, "Main app launched after provisioning");
        } catch (Exception error) {
            Log.e(TAG, "Unable to launch app after provisioning", error);
        }
    }
}
