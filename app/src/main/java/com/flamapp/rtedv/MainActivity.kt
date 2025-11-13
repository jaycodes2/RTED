package com.flamapp.rtedv

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.LifecycleOwner
import com.flamapp.jni.NativeProcessor
import com.flamapp.rtedv.ui.theme.RTEDVTheme
import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import android.widget.LinearLayout // New import needed
import android.widget.FrameLayout // New import needed
import androidx.camera.view.PreviewView // New import needed
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {

    private val nativeProcessor = NativeProcessor()
    private val TAG = "RTEDV_MainActivity"
    private lateinit var cameraExecutor: ExecutorService

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.i(TAG, "Camera permission granted.")
            setupCameraAndUI()
        } else {
            Log.e(TAG, "Camera permission denied. Cannot start video stream.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        cameraExecutor = Executors.newSingleThreadExecutor()

        testJniConnection()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            setupCameraAndUI()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun testJniConnection() {
        try {
            val info = nativeProcessor.getProcessorInfo()
            Log.i(TAG, "JNI Link SUCCESS: $info")
        } catch (e: Exception) {
            Log.e(TAG, "JNI Link FAILED: Native code could not be loaded or called.", e)
        }
    }

    private fun setupCameraAndUI() {
        setContent {
            RTEDVTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    CameraAnalysisScreen(
                        cameraProviderFuture = ProcessCameraProvider.getInstance(LocalContext.current),
                        executor = cameraExecutor,
                        lifecycleOwner = LocalLifecycleOwner.current,
                        nativeProcessor = nativeProcessor,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
}

// =================================================================================
// Composable UI (Simplified to only run analysis)
// =================================================================================


@Composable
fun CameraAnalysisScreen(
    cameraProviderFuture: ListenableFuture<ProcessCameraProvider>,
    executor: ExecutorService,
    lifecycleOwner: LifecycleOwner,
    nativeProcessor: NativeProcessor,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val TAG = "CameraAnalysisScreen"

    var matAddress: Long = 0L

    // FIX: Use a PreviewView (a concrete View) as the placeholder for the camera Preview
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = {
            // Create a dedicated PreviewView for the Camera Preview
            PreviewView(it).apply {
                layoutParams = LinearLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            }
        },
        update = { previewView -> // Now using a concrete PreviewView
            cameraProviderFuture.addListener({
                val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

                // Setup Preview use case and set the PreviewView's SurfaceProvider as the target
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                // Setup Image Analysis use case (Unchanged)
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                // Analyzer logic (The minimal diagnostic logic)
                imageAnalysis.setAnalyzer(executor, ImageAnalysis.Analyzer { imageProxy: ImageProxy ->
                    try {
                        // Log only to confirm the analysis loop is running
                        Log.d(TAG, "CameraX Analysis Loop Running.")
                    } catch (e: Exception) {
                        Log.e(TAG, "Analyzer failed unexpectedly: ${e.message}")
                    } finally {
                        imageProxy.close()
                    }
                })

                // Bind the use cases to the camera
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview, // Now bound to the PreviewView
                        imageAnalysis
                    )
                } catch (exc: Exception) {
                    Log.e(TAG, "Use case binding failed", exc)
                }

            }, ContextCompat.getMainExecutor(context))
        }
    )
}
