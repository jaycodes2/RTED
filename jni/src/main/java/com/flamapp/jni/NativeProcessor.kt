package com.flamapp.jni

object NativeProcessor {

    init {
        try {
            System.loadLibrary("rted-native")
        } catch (e: UnsatisfiedLinkError) {
            System.err.println("Failed to load native library: " + e.message)
        }
    }

    /**
     * Processes the frame using OpenCV Canny edge detection
     */
    external fun processFrame(matAddrRgba: Long)

    /**
     * Updates OpenGL texture with the processed frame
     */
    external fun updateGLTexture(matAddrRgba: Long, textureId: Int)
}