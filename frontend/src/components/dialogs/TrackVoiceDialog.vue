<template>
    <v-dialog v-model="dialogStore.dialogs.trackVoiceDialog" persistent>
        <v-card>
            <v-card-title class="headline">
                {{ languageStore.t('general.voiceRecording') }}
            </v-card-title>
            <v-card-text>
                <div class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" v-if="isRecording" />
                    <p class="mt-4" v-html="languageStore.t('tracker.voiceRecordingInfo')"></p>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn color="error" @click="cancelRecording">
                    {{ languageStore.t('general.discard') }}
                </v-btn>

                <v-btn color="primary" @click="stopAndSendRecording" :disabled="!isRecording">
                    {{ languageStore.t('general.send') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const isRecording = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);

// Dialog-Zustand beobachten
const stopDialogWatch = watch(
    () => dialogStore.dialogs.trackVoiceDialog,
    async (newVal) => {
        if (newVal) {
            await startRecording();
        } else {
            cancelRecording();
        }
    }
);

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.value = new MediaRecorder(stream);
        audioChunks.value = [];

        mediaRecorder.value.ondataavailable = (event) => {
            audioChunks.value.push(event.data);
        };

        mediaRecorder.value.onstop = () => {
            // Audio kann hier vorbereitet oder gespeichert werden
        };

        mediaRecorder.value.start();
        isRecording.value = true;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        dialogStore.closeDialog('trackVoiceDialog');
    }
};

const stopAndSendRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop();
        mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
        isRecording.value = false;

        setTimeout(() => {
            const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' });
            trackerStore.trackFoodByAudio(audioBlob);
            dialogStore.closeDialog('trackVoiceDialog');
        }, 200);
    }
};

const cancelRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop();
        mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    }
    isRecording.value = false;
    audioChunks.value = [];
    dialogStore.closeDialog('trackVoiceDialog');
};

onUnmounted(() => {
    stopDialogWatch();
    if (mediaRecorder.value) {
        if (isRecording.value) {
            mediaRecorder.value.stop();
        }
        mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    }
});
</script>