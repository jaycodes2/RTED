package com.flamapp.jni

/**
 * The Kotlin interface for the native C++ library ("opencv_processor").
 * This class handles loading the native library and declaring the external functions.
 */
class NativeProcessor {

    companion object {
        init {
            // Load the native library. The name must match 'project("opencv_processor")'
            // and 'add_library(...)' in the jni/src/main/cpp/CMakeLists.txt file.
            try {
                System.loadLibrary("opencv_processor")
            } catch (e: UnsatisfiedLinkError) {
                // Important: Handle failure if the library is not found or cannot be loaded.
                println("ERROR: Native library 'opencv_processor' failed to load.")
                e.printStackTrace()
            }
        }
    }

    /**
     * Calls the C++ function to process a frame.
     * @param matAddr The memory address (as a Long) of the OpenCV Mat object.
     * @return The memory address of the processed Mat object.
     */
    external fun processFrame(matAddr: Long): Long

    /**
     * Returns a string from the native C++ code to verify the connection.
     */
    external fun getProcessorInfo(): String
}