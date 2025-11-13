// In jni/src/main/cpp/JniBridge.cpp

#include <jni.h>
#include <android/log.h>
#include <string>
#include "opencv2/core/core.hpp"
#include "OpenCVProcessor.h"     // Your internal C++ API

// Define logging macros
#define LOG_TAG "JniBridge"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// External function to process a frame
extern "C" JNIEXPORT jlong JNICALL
Java_com_flamapp_jni_NativeProcessor_processFrame(
        JNIEnv* env,
        jobject /* this */,
        jlong matAddr) {

    // Cast the jlong address back to a cv::Mat pointer
    cv::Mat* inputMat = reinterpret_cast<cv::Mat*>(matAddr);

    if (inputMat) {
        // Call the core processing function (which applies Canny Edge Detection)
        processor::applyCannyEdge(inputMat);
    } else {
        LOGE("Error: Received null Mat address. Cannot process frame.");
    }

    // Return the address of the modified (processed) Mat
    return matAddr;
}

// Simple function to verify the JNI link and get OpenCV version
extern "C" JNIEXPORT jstring JNICALL
Java_com_flamapp_jni_NativeProcessor_getProcessorInfo(
        JNIEnv* env,
        jobject /* this */) {
    // CV_VERSION is a macro defined by the OpenCV headers
    std::string info = "OpenCV Processor v1.0. OpenCV version: " + std::string(CV_VERSION);
    return env->NewStringUTF(info.c_str());
}