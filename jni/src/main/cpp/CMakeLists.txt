cmake_minimum_required(VERSION 3.22)

project("opencv_processor")

# 1. FIND HEADERS (Include directory)
include_directories(include)

# 2. SOURCE FILES (Your C++ logic)
set(JNI_SRC_FILE JniBridge.cpp)
set(OPENCV_SRC_FILE OpenCVProcessor.cpp)
set(OPENCV_HEADER OpenCVProcessor.h)

# --- 3. LINKING PRE-BUILT LIBRARY (The FIX) ---

# Get the full path to the OpenCV shared library (.so) for the current architecture
# Example: jni/src/main/libs/x86/libopencv_java4.so
set(OPENCV_SHARED_LIB_PATH
        ${CMAKE_CURRENT_SOURCE_DIR}/../libs/${CMAKE_ANDROID_ARCH_ABI}/libopencv_java4.so
)

# Create an imported shared library target named 'opencv_lib'
# This target is external and already built.
add_library(opencv_lib SHARED IMPORTED)

# Tell CMake the location of this specific pre-built library file
set_target_properties(opencv_lib PROPERTIES
        IMPORTED_LOCATION ${OPENCV_SHARED_LIB_PATH}
)

# Find NDK's logging library
find_library(log-lib log)

# --- 4. BUILD YOUR CUSTOM SHARED LIBRARY ---

add_library(
        opencv_processor
        SHARED
        ${JNI_SRC_FILE}
        ${OPENCV_SRC_FILE}
        ${OPENCV_HEADER}
)

# --- 5. LINK LIBRARIES ---

target_link_libraries(
        opencv_processor
        ${log-lib}
        opencv_lib              # Link the imported OpenCV target
)