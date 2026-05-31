// Device Owner receiver stores provisioning extras when Android completes QR provisioning.
package com.emilockercustomer;

import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.PersistableBundle;
import android.util.Log;

public class DeviceAdminReceiver extends android.app.admin.DeviceAdminReceiver {
    private static final String TAG = "CoraDeviceAdmin";
    private static final String PREFS = "emi_prefs";
    private static final String ACTION_PROVISIONING_DONE = "com.emilockercustomer.PROVISIONING_DONE";

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
            .apply();
        Log.i(TAG, "Provisioning extras saved for customer=" + extras.getString("customerId", ""));
    }

    private void launchMainApp(Context context) {
        try {
            PackageManager packageManager = context.getPackageManager();
            Intent launchIntent = packageManager.getLaunchIntentForPackage(context.getPackageName());

            if (launchIntent == null) {
                Log.w(TAG, "Unable to launch app after provisioning: launch intent missing");
                return;
            }

            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(launchIntent);
            Log.i(TAG, "Main app launched after provisioning");
        } catch (Exception error) {
            Log.e(TAG, "Unable to launch app after provisioning", error);
        }
    }
}
