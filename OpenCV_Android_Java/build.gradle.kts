// OpenCV_Android_Java/build.gradle.kts

plugins {
    id("com.android.library")
    kotlin("android")
}

android {
    namespace = "org.opencv.android"
    compileSdk = 36

    defaultConfig {
        minSdk = 26
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    // ⚠️ CRITICAL FIX: EXCLUDE PROBLEMATIC FILES
    sourceSets {
        getByName("main") {
            // CRITICAL: Point ONLY to the 'src' directory, which contains the 'org' package.
            java.srcDirs("src")

            // REMOVE all 'exclude' or 'fileTree' blocks completely
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
}

dependencies {
    // No external dependencies needed here, only core Android libraries implicitly used.
}