// In jni/src/main/cpp/OpenCVProcessor.cpp

#include "OpenCVProcessor.h"
#include "opencv2/imgproc.hpp" // Required for cv::Canny, cv::cvtColor
#include "opencv2/core/core.hpp"
#include <android/log.h>

#define LOG_TAG "OpenCVProcessor"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace processor {

    /**
     * @brief Applies Canny Edge Detection to the image.
     * @param matPtr A pointer to the OpenCV Mat object (will be processed in place).
     */
    void applyCannyEdge(cv::Mat* matPtr) {
        if (!matPtr || matPtr->empty()) {
            LOGE("Input Mat is null or empty. Skipping processing.");
            return;
        }

        cv::Mat grayMat;

        // 1. Convert to Grayscale (Canny requires single-channel input).
        // Check if the input Mat is color (e.g., RGBA from the camera)
        if (matPtr->channels() > 1) {
            // Convert from RGBA (common camera format) to GRAY
            cv::cvtColor(*matPtr, grayMat, cv::COLOR_RGBA2GRAY);
        } else {
            // If already single channel, use it directly
            grayMat = *matPtr;
        }

        // 2. Apply Canny Edge Detection.
        // The output is a single-channel binary edge map, which overwrites the original *matPtr.
        cv::Canny(grayMat, *matPtr, 100, 200, 3);

        LOGI("Canny Edge Detection applied.");
    }

    /**
     * @brief Converts the image to grayscale (alternative filter).
     * @param matPtr A pointer to the OpenCV Mat object (will be processed in place).
     */
    void applyGrayscale(cv::Mat* matPtr) {
        if (!matPtr || matPtr->empty()) return;

        // Convert in-place from RGBA/RGB to Grayscale
        if (matPtr->channels() > 1) {
            cv::cvtColor(*matPtr, *matPtr, cv::COLOR_RGBA2GRAY);
            LOGI("Grayscale filter applied.");
        }
    }

} // namespace processor