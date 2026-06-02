# Proguard rules placeholder for release builds.
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keepclassmembers class * {
    native <methods>;
}
-keep class com.emilockercustomer.** { *; }
