package com.emilockercustomer;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

public class ProvisioningModeActivity extends Activity {
    private static final String TAG = "CoraProvisioningMode";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent result = new Intent();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            result.putExtra(
                DevicePolicyManager.EXTRA_PROVISIONING_MODE,
                DevicePolicyManager.PROVISIONING_MODE_FULLY_MANAGED_DEVICE
            );
            Log.i(TAG, "Selected fully managed device provisioning mode");
        } else {
            Log.i(TAG, "Provisioning mode callback opened below Android 12");
        }

        setResult(Activity.RESULT_OK, result);
        finish();
    }
}
