package com.emilockercustomer;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.PersistableBundle;
import android.os.Bundle;
import android.util.Log;

public class AdminPolicyComplianceActivity extends Activity {
    private static final String TAG = "CoraPolicyCompliance";
    private static final String PREFS = "emi_prefs";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "Admin policy compliance acknowledged");
        persistProvisioningExtras();
        launchMainApp();
        setResult(Activity.RESULT_OK);
        finish();
    }

    private void persistProvisioningExtras() {
        try {
            PersistableBundle extras = getIntent().getParcelableExtra(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE);

            if (extras == null) {
                Log.w(TAG, "Policy compliance extras were missing");
                return;
            }

            SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("customerId", extras.getString("customerId", ""))
                .putString("retailerId", extras.getString("retailerId", ""))
                .putString("enrollmentKey", extras.getString("enrollmentKey", ""))
                .putString("backendUrl", extras.getString("backendUrl", ""))
                .putBoolean("provisioning_complete", true)
                .apply();
            Log.i(TAG, "Policy compliance extras saved for customer=" + extras.getString("customerId", ""));
        } catch (Exception error) {
            Log.e(TAG, "Unable to save policy compliance extras", error);
        }
    }

    private void launchMainApp() {
        try {
            PackageManager packageManager = getPackageManager();
            Intent launchIntent = packageManager.getLaunchIntentForPackage(getPackageName());

            if (launchIntent == null) {
                Log.w(TAG, "Unable to launch app after policy compliance: launch intent missing");
                return;
            }

            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(launchIntent);
            Log.i(TAG, "Main app launched after policy compliance");
        } catch (Exception error) {
            Log.e(TAG, "Unable to launch app after policy compliance", error);
        }
    }
}
