// React Native application class; registers the custom DeviceAdmin native module package.
package com.emilockercustomer;

import android.app.Application;
import android.util.Log;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainApplication extends Application implements ReactApplication {
    private static final String TAG = "CoraMainApplication";

    private final ReactNativeHost reactNativeHost =
        new DefaultReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                List<ReactPackage> packages = new PackageList(this).getPackages();
                packages.add(new DeviceAdminPackage());
                return packages;
            }

            @Override
            protected String getJSMainModuleName() {
                return "index";
            }

            @Override
            protected boolean isNewArchEnabled() {
                return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
            }

            @Override
            protected Boolean isHermesEnabled() {
                return BuildConfig.IS_HERMES_ENABLED;
            }
        };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return reactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        installNativeCrashLogger();
        try {
            SoLoader.init(this, OpenSourceMergedSoMapping.INSTANCE);
        } catch (Exception error) {
            throw new RuntimeException("Unable to initialize SoLoader", error);
        }

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
    }

    private void installNativeCrashLogger() {
        Thread.UncaughtExceptionHandler previousHandler = Thread.getDefaultUncaughtExceptionHandler();

        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            writeNativeCrash(thread, throwable);

            if (previousHandler != null) {
                previousHandler.uncaughtException(thread, throwable);
            }
        });
    }

    private void writeNativeCrash(Thread thread, Throwable throwable) {
        try {
            File directory = getExternalFilesDir(null);
            if (directory == null) {
                directory = getFilesDir();
            }

            File crashFile = new File(directory, "emi_native_crash.txt");
            String timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US).format(new Date());
            StringBuilder builder = new StringBuilder();
            builder.append(timestamp).append("\n");
            builder.append("Thread: ").append(thread != null ? thread.getName() : "unknown").append("\n");
            builder.append(Log.getStackTraceString(throwable)).append("\n\n");

            try (FileOutputStream outputStream = new FileOutputStream(crashFile, true)) {
                outputStream.write(builder.toString().getBytes(StandardCharsets.UTF_8));
            }
        } catch (Exception error) {
            Log.e(TAG, "Unable to write native crash file", error);
        }
    }
}
