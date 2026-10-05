package de.meindeutsch.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** A real asynchronous Capacitor call, independent of the legacy Native bridge. */
@CapacitorPlugin(name = "AppEnvironment")
public class AppEnvironmentPlugin extends Plugin {
    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("package", getContext().getPackageName());
        result.put("androidApi", android.os.Build.VERSION.SDK_INT);
        result.put("nativeStorage", "app-private AtomicFile; async StudyStorage Capacitor plugin");
        result.put("speech", "Android TTS; async StudySpeech Capacitor plugin");
        result.put("stage", "capacitor-1.0.7");
        call.resolve(result);
    }
}
