// In jni/src/main/cpp/OpenCVProcessor.h

#ifndef REALTIMEVIDEOPROCESSOR_OPENCVPROCESSOR_H
#define REALTIMEVIDEOPROCESSOR_OPENCVPROCESSOR_H

// Forward declaration for the core OpenCV Mat class
// We use 'class Mat' to avoid including the massive OpenCV headers here, which keeps compile times fast.
namespace cv {
    class Mat;
}

namespace processor {
    /**
     * @brief Applies a Canny Edge Detection filter to the input image.
     * @param matPtr A pointer to the OpenCV Mat object to be processed.
     */
    void applyCannyEdge(cv::Mat* matPtr);

    /**
     * @brief Converts the image to grayscale (or other simple filter).
     * @param matPtr A pointer to the OpenCV Mat object to be processed.
     */
    void applyGrayscale(cv::Mat* matPtr);

} // namespace processor

#endif // REALTIMEVIDEOPROCESSOR_OPENCVPROCESSOR_H