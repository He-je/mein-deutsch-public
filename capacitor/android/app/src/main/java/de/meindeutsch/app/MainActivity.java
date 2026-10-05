package de.meindeutsch.app;

import android.media.AudioManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/** Thin Capacitor host: native services are plugins, with no legacy JS bridge. */
public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle saved){
        registerPlugin(AppEnvironmentPlugin.class);
        registerPlugin(StudyStoragePlugin.class);
        registerPlugin(StudySpeechPlugin.class);
        super.onCreate(saved);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        getOnBackPressedDispatcher().addCallback(this,new androidx.activity.OnBackPressedCallback(true){
            @Override public void handleOnBackPressed(){
                bridge.getWebView().evaluateJavascript("window.onNativeBack && window.onNativeBack()",null);
            }
        });
    }
    @Override protected void load(){
        android.webkit.WebView web=findViewById(com.getcapacitor.android.R.id.webview);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setTextZoom((int)(getResources().getConfiguration().fontScale*100));
        super.load();
    }
}
