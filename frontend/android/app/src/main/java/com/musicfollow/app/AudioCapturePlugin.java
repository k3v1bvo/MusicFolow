package com.musicfollow.app;

import android.media.AudioFormat;
import android.media.AudioPlaybackCaptureConfiguration;
import android.media.AudioRecord;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.content.Intent;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import androidx.activity.result.ActivityResult;
import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AudioCapture")
public class AudioCapturePlugin extends Plugin {

    private static final String TAG = "AudioCapturePlugin";
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_STEREO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private static final int BUFFER_SIZE = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT) * 4;

    private AudioRecord audioRecord;
    private boolean isCapturing = false;
    private ExecutorService executor;
    private MediaProjection mediaProjection;
    private MediaProjectionManager projectionManager;
    private PluginCall savedCall;

    @Override
    public void load() {
        projectionManager = (MediaProjectionManager) getActivity()
            .getSystemService(android.content.Context.MEDIA_PROJECTION_SERVICE);
    }

    @PluginMethod
    public void startCapture(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("La captura de audio interno requiere Android 10 o superior");
            return;
        }
        this.savedCall = call;
        // Solicitar permiso de MediaProjection (abre el diálogo del sistema)
        Intent captureIntent = projectionManager.createScreenCaptureIntent();
        startActivityForResult(call, captureIntent, "handleProjectionResult");
    }

    @ActivityCallback
    @RequiresApi(api = Build.VERSION_CODES.Q)
    private void handleProjectionResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != android.app.Activity.RESULT_OK) {
            call.reject("El usuario canceló el permiso de captura");
            return;
        }

        mediaProjection = projectionManager.getMediaProjection(
            result.getResultCode(),
            result.getData()
        );

        // Configurar captura de audio interno
        AudioPlaybackCaptureConfiguration config = new AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
            .addMatchingUsage(android.media.AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(android.media.AudioAttributes.USAGE_GAME)
            .addMatchingUsage(android.media.AudioAttributes.USAGE_UNKNOWN)
            .build();

        audioRecord = new AudioRecord.Builder()
            .setAudioPlaybackCaptureConfig(config)
            .setAudioFormat(new AudioFormat.Builder()
                .setEncoding(AUDIO_FORMAT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(CHANNEL_CONFIG)
                .build())
            .setBufferSizeInBytes(BUFFER_SIZE)
            .build();

        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            call.reject("No se pudo inicializar la captura de audio");
            return;
        }

        isCapturing = true;
        audioRecord.startRecording();

        executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            byte[] buffer = new byte[BUFFER_SIZE];
            while (isCapturing) {
                int bytesRead = audioRecord.read(buffer, 0, buffer.length);
                if (bytesRead > 0) {
                    // Convertir a Base64 y enviar al JavaScript via evento
                    String base64Chunk = Base64.encodeToString(buffer, 0, bytesRead, Base64.NO_WRAP);
                    JSObject data = new JSObject();
                    data.put("chunk", base64Chunk);
                    data.put("sampleRate", SAMPLE_RATE);
                    data.put("channels", 2);
                    notifyListeners("audioChunk", data);
                }
            }
        });

        call.resolve(new JSObject().put("status", "capturing"));
        Log.d(TAG, "Audio interno del sistema iniciado");
    }

    @PluginMethod
    public void stopCapture(PluginCall call) {
        isCapturing = false;
        if (audioRecord != null) {
            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
        if (executor != null) {
            executor.shutdown();
        }
        call.resolve(new JSObject().put("status", "stopped"));
        Log.d(TAG, "Captura de audio detenida");
    }
}
