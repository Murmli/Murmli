<script setup>
import { ref, onUnmounted, watch } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(['update:modelValue', 'captured']);

const languageStore = useLanguageStore();

const internalOpen = ref(props.modelValue);
const videoRef = ref(null);
const stream = ref(null);
const isCapturing = ref(false);
const errorMessage = ref('');
const hasMultipleCameras = ref(false);
const currentFacingMode = ref('environment'); // Default to back camera

watch(() => props.modelValue, (val) => {
  internalOpen.value = val;
  if (val) {
    checkPermissionsAndStart();
  } else {
    stopCamera();
  }
});

watch(internalOpen, (val) => {
  emit('update:modelValue', val);
});

const checkPermissionsAndStart = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['camera'] });
        if (request.camera !== 'granted') {
          errorMessage.value = languageStore.t('general.cameraPermissionDenied');
          return;
        }
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
  }
  startCamera();
};

const startCamera = async () => {
  errorMessage.value = '';
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    hasMultipleCameras.value = videoDevices.length > 1;

    const constraints = {
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
    }
  } catch (err) {
    console.error('Error accessing camera:', err);
    errorMessage.value = languageStore.t('general.cameraError');
  }
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }
};

const flipCamera = () => {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';
  stopCamera();
  setTimeout(() => {
    startCamera();
  }, 100);
};

const takePhoto = () => {
  if (!videoRef.value || isCapturing.value) return;
  isCapturing.value = true;

  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  
  // Use natural video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      emit('captured', file);
      close();
    }
    isCapturing.value = false;
  }, 'image/jpeg', 0.85); 
};

const close = () => {
  internalOpen.value = false;
  stopCamera();
};

onUnmounted(() => {
  stopCamera();
});
</script>

<template>
  <v-dialog v-model="internalOpen" fullscreen transition="dialog-bottom-transition" :scrim="false" style="z-index: 3000;">
    <v-card class="camera-card">
      <div class="camera-wrapper">
        <video ref="videoRef" autoplay playsinline muted class="camera-video"></video>
        
        <div class="camera-overlay">
           <div class="top-bar">
             <v-btn icon="mdi-close" variant="tonal" color="white" @click="close"></v-btn>
             <v-spacer></v-spacer>
             <v-btn v-if="hasMultipleCameras" icon="mdi-camera-flip" variant="tonal" color="white" @click="flipCamera"></v-btn>
           </div>
           
           <div class="bottom-bar">
             <div class="capture-button-container">
               <v-btn 
                 icon="mdi-camera" 
                 size="72" 
                 color="primary" 
                 elevation="4"
                 :loading="isCapturing"
                 @click="takePhoto"
                 class="capture-btn"
               ></v-btn>
             </div>
           </div>
        </div>
      </div>
      
      <v-snackbar v-model="!!errorMessage" color="error" timeout="5000">
        {{ errorMessage }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.camera-card {
  background-color: black !important;
  overflow: hidden;
}

.camera-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.4) 100%);
}

.top-bar {
  padding: 16px;
  display: flex;
  pointer-events: auto;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
}

.bottom-bar {
  margin-top: auto;
  padding: 40px 16px;
  display: flex;
  justify-content: center;
  pointer-events: auto;
  background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
}

.capture-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.capture-btn {
  border: 4px solid white !important;
}

@media (max-aspect-ratio: 9/16) {
  .camera-video {
    width: 100vw;
    height: 100vh;
  }
}
</style>
