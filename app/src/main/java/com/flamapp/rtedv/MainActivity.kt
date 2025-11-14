package com.flamapp.rtedv

import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.util.Size
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.flamapp.gl.GlCameraView
import com.flamapp.jni.NativeProcessor
import org.opencv.android.OpenCVLoader
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var viewFinder: GlCameraView
    private lateinit var cameraExecutor: ExecutorService
    private var imageAnalysis: ImageAnalysis? = null

    // Mat objects (reused across frames for efficiency)
    private var yuvMat: Mat? = null
    private var rgbaMat: Mat? = null
    private var isProcessingEnabled = true

    // Constants
    private val REQUIRED_PERMISSIONS = arrayOf(android.Manifest.permission.CAMERA)
    private val REQUEST_CODE_PERMISSIONS = 10
    private val TAG = "RTED_APP"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize OpenCV before any other operations
        initOpenCV()

        viewFinder = findViewById(R.id.viewFinder)
        cameraExecutor = Executors.newSingleThreadExecutor()

        // Toggle Button Logic
        findViewById<ImageButton>(R.id.toggleButton).setOnClickListener {
            isProcessingEnabled = !isProcessingEnabled
            val status = if (isProcessingEnabled) "Edge Detection ON" else "Raw Feed ON"
            Toast.makeText(this, status, Toast.LENGTH_SHORT).show()
        }

        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestPermissions()
        }
    }

    // --- 1. Initialization & Permissions ---

    private fun initOpenCV() {
        if (OpenCVLoader.initLocal()) {
            Log.d(TAG, "OpenCV initialization successful.")
        } else {
            Log.e(TAG, "OpenCV initialization failed!")
            Toast.makeText(this, "Failed to load OpenCV.", Toast.LENGTH_LONG).show()
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Camera permission not granted.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    // --- 2. CameraX Binding and Analysis ---

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            // 1. Image Analysis Use Case
            imageAnalysis?.let { cameraProvider.unbind(it) }

            imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(Size(640, 480))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            // Set the frame analyzer to our custom processor
            imageAnalysis!!.setAnalyzer(cameraExecutor, FrameProcessor())

            try {
                cameraProvider.unbindAll()
                // Bind ONLY the ImageAnalysis Use Case
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, imageAnalysis
                )
            } catch(exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // --- 3. Real-Time Frame Processing ---

    inner class FrameProcessor : ImageAnalysis.Analyzer {

        private fun convertImageProxyToMat(image: ImageProxy): Mat {
            val yBuffer = image.planes[0].buffer
            val uBuffer = image.planes[1].buffer
            val vBuffer = image.planes[2].buffer

            val ySize = yBuffer.remaining()
            val uSize = uBuffer.remaining()
            val vSize = vBuffer.remaining()

            val nv21 = ByteArray(ySize + uSize + vSize)
            yBuffer.get(nv21, 0, ySize)
            vBuffer.get(nv21, ySize, vSize)
            uBuffer.get(nv21, ySize + vSize, uSize)

            if (yuvMat == null) {
                yuvMat = Mat(image.height + image.height / 2, image.width, CvType.CV_8UC1)
                rgbaMat = Mat(image.height, image.width, CvType.CV_8UC4)
            }

            yuvMat!!.put(0, 0, nv21)
            Imgproc.cvtColor(yuvMat, rgbaMat, Imgproc.COLOR_YUV2RGBA_NV21)

            return rgbaMat!!
        }

        override fun analyze(imageProxy: ImageProxy) {
            val currentFrameMat = convertImageProxyToMat(imageProxy)

            if (isProcessingEnabled) {
                // Process the frame on the CPU/JNI side
                NativeProcessor.processFrame(currentFrameMat.nativeObj)
            }

            // Send the processed Mat to the OpenGL View for GPU rendering
            viewFinder.onFrame(currentFrameMat)

            // Must close the image to release the buffer and receive the next frame
            imageProxy.close()
        }
    }

    // --- 4. Cleanup ---

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        rgbaMat?.release()
        yuvMat?.release()
    }
}