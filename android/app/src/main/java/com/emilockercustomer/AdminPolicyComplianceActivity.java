package com.emilockercustomer;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;

public class AdminPolicyComplianceActivity extends Activity {
    private static final String TAG = "CoraPolicyCompliance";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "Admin policy compliance acknowledged");
        launchMainApp();
        setResult(Activity.RESULT_OK);
        finish();
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
