package de.meindeutsch.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.AtomicFile;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

/** Async Capacitor boundary; private atomic storage and user-selected documents. */
@CapacitorPlugin(name="StudyStorage")
public class StudyStoragePlugin extends Plugin {
    private static final int MAX=25000000;
    // One process-wide queue also orders a pending save before a new Activity's
    // load during recreation. Do not shut it down with a particular Activity.
    private static final ExecutorService io=Executors.newSingleThreadExecutor();
    private final AtomicBoolean pickerBusy=new AtomicBoolean(false);

    private AtomicFile library() { return new AtomicFile(new File(getContext().getFilesDir(),"library.json")); }
    private byte[] bytes(String text) throws IOException {
        if(text==null) throw new IOException("Missing content.");
        byte[] value=text.getBytes(StandardCharsets.UTF_8);
        if(value.length>MAX) throw new IOException("File exceeds 25 MB.");
        return value;
    }
    private String read(InputStream input) throws IOException {
        if(input==null) throw new IOException("The selected file cannot be opened.");
        try(InputStream in=input; ByteArrayOutputStream out=new ByteArrayOutputStream()) {
            byte[] buffer=new byte[8192]; int count;
            while((count=in.read(buffer))!=-1) {
                if(out.size()+count>MAX) throw new IOException("File exceeds 25 MB.");
                out.write(buffer,0,count);
            }
            return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(out.toByteArray())).toString();
        }
    }
    @PluginMethod public void load(PluginCall call) {
        io.execute(()->{
            try {
                AtomicFile file=library(); String raw;
                try { raw=read(file.openRead()); }
                catch(FileNotFoundException e) {
                    // Only absence is an empty library; unreadable existing files are errors.
                    if(file.getBaseFile().exists() || new File(file.getBaseFile()+".bak").exists()) throw e;
                    raw="";
                }
                call.resolve(new JSObject().put("raw",raw));
            } catch(Exception e) { call.reject("Saved data could not be read. Preserve a backup before restoring.",e); }
        });
    }
    @PluginMethod public void save(PluginCall call) {
        final String raw=call.getString("raw");
        io.execute(()->{
            AtomicFile file=library(); FileOutputStream out=null;
            try {
                byte[] value=bytes(raw);
                new JSONObject(raw); // Semantic validation is shared with the web app.
                out=file.startWrite(); out.write(value); file.finishWrite(out); out=null;
                call.resolve();
            } catch(Exception e) {
                if(out!=null) file.failWrite(out);
                call.reject("Device storage could not save the library.",e);
            }
        });
    }
    private void launch(PluginCall call, Intent intent, String callback) {
        if(!pickerBusy.compareAndSet(false,true)) { call.reject("A file dialog is already open."); return; }
        getActivity().runOnUiThread(()->{
            try { startActivityForResult(call,intent,callback); }
            catch(Exception e) { pickerBusy.set(false); call.reject("Could not open the file dialog.",e); }
        });
    }
    @PluginMethod public void pick(PluginCall call) {
        launch(call,new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*")
            .addCategory(Intent.CATEGORY_OPENABLE),"picked");
    }
    @ActivityCallback private void picked(PluginCall call, ActivityResult result) {
        pickerBusy.set(false);
        if(call==null) return; // Process recreation: never import without a live review flow.
        if(result.getResultCode()!=Activity.RESULT_OK) { call.resolve(new JSObject().put("cancelled",true)); return; }
        final Uri uri=result.getData()==null?null:result.getData().getData();
        if(uri==null) { call.reject("No file was returned."); return; }
        io.execute(()->{
            try { call.resolve(new JSObject().put("raw",read(getContext().getContentResolver().openInputStream(uri)))); }
            catch(Exception e) { call.reject("Could not read file: "+e.getMessage(),e); }
        });
    }
    @PluginMethod public void exportFile(PluginCall call) {
        try { bytes(call.getString("content")); }
        catch(Exception e) { call.reject(e.getMessage(),e); return; }
        String name=call.getString("name","export.json").replaceAll("[^a-zA-Z0-9._-]","_");
        String type="text/plain".equals(call.getString("type"))?"text/plain":"application/json";
        launch(call,new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
            .setType(type).putExtra(Intent.EXTRA_TITLE,name),"exported");
    }
    @ActivityCallback private void exported(PluginCall call, ActivityResult result) {
        pickerBusy.set(false);
        if(call==null) return;
        if(result.getResultCode()!=Activity.RESULT_OK) { call.resolve(new JSObject().put("cancelled",true)); return; }
        final Uri uri=result.getData()==null?null:result.getData().getData();
        if(uri==null) { call.reject("No destination was returned."); return; }
        // Content belongs to this call, so it cannot be replaced by another export.
        final String content=call.getString("content");
        io.execute(()->{
            try {
                byte[] value=bytes(content);
                try(OutputStream out=getContext().getContentResolver().openOutputStream(uri,"wt")) {
                    if(out==null) throw new IOException("Destination is not writable.");
                    out.write(value); out.flush();
                }
                call.resolve(new JSObject().put("saved",true));
            } catch(Exception e) { call.reject("File was not saved: "+e.getMessage(),e); }
        });
    }
    @PluginMethod public void copy(PluginCall call) {
        final String text=call.getString("text");
        try { bytes(text); } catch(Exception e) { call.reject(e.getMessage(),e); return; }
        getActivity().runOnUiThread(()->{
            try {
                ClipboardManager clipboard=(ClipboardManager)getContext().getSystemService(Context.CLIPBOARD_SERVICE);
                if(clipboard==null) throw new IOException("Clipboard unavailable.");
                clipboard.setPrimaryClip(ClipData.newPlainText("Mein Deutsch prompt",text)); call.resolve();
            } catch(Exception e) { call.reject("Could not copy the prompt.",e); }
        });
    }
}
