#include <jni.h>
#include <opencv2/core/core.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <android/log.h>

// Add OpenGL ES includes
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>

using namespace cv;

#define TAG "RTED_JNI"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, TAG, __VA_ARGS__)

// Fix: Change package name from com.rted.app to com.flamapp.jni
extern "C" JNIEXPORT void JNICALL
Java_com_flamapp_jni_NativeProcessor_processFrame(
        JNIEnv *env,
        jclass clazz,
        jlong matAddrRgba) {

    Mat& inputMat = *(Mat*)matAddrRgba;

    if (inputMat.empty() || inputMat.channels() != 4) {
        LOGE("Input Mat is empty or wrong format (expected RGBA).");
        return;
    }

    try {
        Mat grayMat;
        cvtColor(inputMat, grayMat, COLOR_RGBA2GRAY);

        Mat detectedEdges;
        Canny(grayMat, detectedEdges, 50, 150, 3);

        cvtColor(detectedEdges, inputMat, COLOR_GRAY2RGBA);

    } catch (const cv::Exception& e) {
        LOGE("OpenCV Error: %s", e.what());
    }
}

// Add the missing updateGLTexture function that GLSurfaceViewRenderer expects
extern "C" JNIEXPORT void JNICALL
Java_com_flamapp_jni_NativeProcessor_updateGLTexture(
        JNIEnv *env,
        jclass clazz,
        jlong matAddrRgba,
        jint textureId) {

    Mat& inputMat = *(Mat*)matAddrRgba;

    if (inputMat.empty()) {
        LOGE("Input Mat is empty for texture update.");
        return;
    }

    // Basic texture upload
    glBindTexture(GL_TEXTURE_2D, textureId);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, inputMat.cols, inputMat.rows, 0,
                 GL_RGBA, GL_UNSIGNED_BYTE, inputMat.data);

    // Set texture parameters (important for proper rendering)
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
}