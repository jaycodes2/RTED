package com.flamapp.gl

import android.opengl.GLES20
import android.opengl.GLSurfaceView
import org.opencv.core.Mat
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

/**
 * Manages the OpenGL drawing environment, shaders, and textures.
 */
class CameraGlRenderer(private val glView: GlCameraView) : GLSurfaceView.Renderer {

    // Stores the Mat data received from the processing thread
    private var currentMat: Mat? = null

    // Shader and texture variables
    private var programHandle: Int = 0
    private val textureObjectHandle = IntArray(1)
    private var buffer: ByteBuffer? = null

    @Volatile var textureId: Int = 0 // Public ID for synchronization

    // Vertex coordinates for a simple rectangle that covers the entire screen (fullscreen quad)
    private val vertexData = floatArrayOf(
        -1.0f, -1.0f, 0.0f,  // bottom left
        -1.0f, 1.0f, 0.0f,   // top left
        1.0f, -1.0f, 0.0f,   // bottom right
        1.0f, 1.0f, 0.0f     // top right
    )

    // Texture coordinates (matches the vertices to align the image correctly)
    private val textureData = floatArrayOf(
        0.0f, 1.0f,  // bottom left
        0.0f, 0.0f,  // top left
        1.0f, 1.0f,  // bottom right
        1.0f, 0.0f   // top right
    )

    // Buffers for passing vertex and texture coordinates to the GPU
    private val vertexBuffer = ByteBuffer.allocateDirect(vertexData.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().apply { put(vertexData).position(0) }
    private val textureBuffer = ByteBuffer.allocateDirect(textureData.size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().apply { put(textureData).position(0) }

    // Handles for shader attributes
    private var aPositionHandle = 0
    private var aTextureCoordHandle = 0
    private var uTextureUnitHandle = 0

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        // Set clear color to black
        GLES20.glClearColor(0.0f, 0.0f, 0.0f, 1.0f)

        // Initialize Shaders
        programHandle = GlUtils.createProgram(GlUtils.vertexShaderCode, GlUtils.fragmentShaderCode)

        // Get shader attribute locations
        aPositionHandle = GLES20.glGetAttribLocation(programHandle, "aPosition")
        aTextureCoordHandle = GLES20.glGetAttribLocation(programHandle, "aTextureCoord")
        uTextureUnitHandle = GLES20.glGetUniformLocation(programHandle, "uTextureUnit")

        // Initialize Texture
        GLES20.glGenTextures(1, textureObjectHandle, 0)
        textureId = textureObjectHandle[0]

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)

        // Set texture parameters (CRITICAL for power-of-two texture handling)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
    }

    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)

        // Use the shader program
        GLES20.glUseProgram(programHandle)

        // Only draw if we have a frame to render
        synchronized(this) {
            currentMat?.let { mat ->
                // Check if the Mat is valid and has data
                if (!mat.empty() && mat.cols() > 0 && mat.rows() > 0) {
                    // Calculate required buffer size
                    val requiredSize = mat.rows() * mat.cols() * mat.channels()

                    // Re-allocate buffer only if size changes or doesn't exist
                    if (buffer == null || buffer!!.capacity() < requiredSize) {
                        buffer = ByteBuffer.allocateDirect(requiredSize)
                        buffer?.order(ByteOrder.nativeOrder())
                    }

                    // Clear and prepare buffer
                    buffer?.clear()

                    // Directly get the Mat data into the buffer - FIXED APPROACH
                    val data = ByteArray(requiredSize)
                    mat.get(0, 0, data)
                    buffer?.put(data)
                    buffer?.position(0)

                    // Bind the texture
                    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
                    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)

                    // Load the new pixel data into the bound texture
                    GLES20.glTexImage2D(
                        GLES20.GL_TEXTURE_2D,
                        0,
                        GLES20.GL_RGBA,
                        mat.cols(),
                        mat.rows(),
                        0,
                        GLES20.GL_RGBA,
                        GLES20.GL_UNSIGNED_BYTE,
                        buffer
                    )

                    // Set texture unit
                    GLES20.glUniform1i(uTextureUnitHandle, 0)
                }
            }
        }

        // Set up vertex attributes
        vertexBuffer.position(0)
        GLES20.glEnableVertexAttribArray(aPositionHandle)
        GLES20.glVertexAttribPointer(aPositionHandle, 3, GLES20.GL_FLOAT, false, 0, vertexBuffer)

        textureBuffer.position(0)
        GLES20.glEnableVertexAttribArray(aTextureCoordHandle)
        GLES20.glVertexAttribPointer(aTextureCoordHandle, 2, GLES20.GL_FLOAT, false, 0, textureBuffer)

        // Draw the fullscreen quad (triangle strip)
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)

        // Clean up
        GLES20.glDisableVertexAttribArray(aPositionHandle)
        GLES20.glDisableVertexAttribArray(aTextureCoordHandle)
    }

    /**
     * Called by GlCameraView to provide the next frame.
     */
    fun updateFrame(mat: Mat) {
        // Use synchronization since this is called from the UI thread (via requestRender)
        // while onDrawFrame runs on the GL thread.
        synchronized(this) {
            currentMat = mat
        }
    }
}