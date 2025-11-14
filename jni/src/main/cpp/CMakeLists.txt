cmake_minimum_required(VERSION 3.4.1)
project("RTEDNativeProcessor")

# --- 1. Set OpenCV paths ---
set(OPENCV_INCLUDE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/include")
set(OPENCV_LIB_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../libs/${ANDROID_ABI}")

# Debug message to verify paths
message(STATUS "OpenCV Include Path: ${OPENCV_INCLUDE_PATH}")
message(STATUS "OpenCV Library Path: ${OPENCV_LIB_PATH}")
message(STATUS "Android ABI: ${ANDROID_ABI}")

# --- 2. Create the Native Library ---
add_library(rted-native
        SHARED
        native-lib.cpp
)

# --- 3. Include directories ---
target_include_directories(rted-native
        PRIVATE
        ${OPENCV_INCLUDE_PATH}
)

# --- 4. Link libraries using direct path ---
target_link_libraries(rted-native
        "${OPENCV_LIB_PATH}/libopencv_java4.so"  # Direct path to library
        android
        log
        GLESv2
)