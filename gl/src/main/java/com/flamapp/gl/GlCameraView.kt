package com.flamapp.gl
// gl/src/main/java/com/rted/gl/GlCameraView.kt


import android.content.Context
import android.opengl.GLSurfaceView
import android.util.AttributeSet
import org.opencv.core.Mat

/**
 * Custom GLSurfaceView responsible for handling OpenGL rendering.
 * The renderer draws the latest frame provided by the camera pipeline.
 */
class GlCameraView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : GLSurfaceView(context, attrs) {

    // The Renderer is where all the OpenGL drawing code resides.
    private lateinit var glRenderer: CameraGlRenderer

    init {
        // We must ensure this is set before setting the renderer.
        setEGLContextClientVersion(2)

        // Initialize and set the custom renderer.
        glRenderer = CameraGlRenderer(this)
        setRenderer(glRenderer)

        // Render mode is set to RENDERMODE_WHEN_DIRTY for efficiency.
        // This means the screen only redraws when we explicitly call requestRender().
        renderMode = RENDERMODE_WHEN_DIRTY
    }

    /**
     * Public method to receive the processed Mat from the Kotlin pipeline.
     * @param processedMat The Mat object containing the Canny Edge data (RGBA).
     */
    fun onFrame(processedMat: Mat) {
        // Pass the Mat reference to the renderer.
        glRenderer.updateFrame(processedMat)
        // Request OpenGL to redraw the screen with the new frame.
        requestRender()
    }

    fun getTextureId(): Int {
        return glRenderer.textureId
    }
}