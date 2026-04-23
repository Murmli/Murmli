<template>
    <v-dialog v-model="dialogBinding" persistent>
        <v-card>
            <v-card-title class="headline">
                {{ languageStore.t('general.voiceRecording') }}
            </v-card-title>
            <v-card-text>
                <div class="text-center py-4">
                    <v-progress-circular indeterminate color="primary"
                        v-if="isInitializing || isRecording || isProcessing" />
                    <p class="mt-4" v-if="isRecording" v-html="displayText"></p>
                    
                    <v-btn v-if="showSend && isRecording" color="primary" block class="mt-4" prepend-icon="mdi-send" @click="stopAndProcess(true)">
                        {{ languageStore.t('general.sendDirectly') }}
                    </v-btn>

                    <v-alert v-if="errorMessage" type="error" class="mt-3">
                        {{ errorMessage }}
                    </v-alert>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn color="error" variant="text" :disabled="isProcessing" @click="cancelRecording">
                    {{ languageStore.t('general.discard') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" :disabled="!isRecording" @click="stopAndProcess(false)">
                    {{ languageStore.t('general.confirm') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';

const props = defineProps({
    dialogKey: {
        type: String,
        required: true,
    },
    infoText: {
        type: String,
        default: '',
    },
    mode: {
        type: String,
        default: 'audio',
        validator: (value) => ['audio', 'transcribe'].includes(value),
    },
    autoCloseOnComplete: {
        type: Boolean,
        default: true,
    },
    showSend: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['completed', 'send', 'cancelled', 'error']);

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const apiStore = useApiStore();

const isRecording = ref(false);
const isProcessing = ref(false);
const isInitializing = ref(false);
const errorMessage = ref('');
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const shouldProcessRecording = ref(false);
const sendImmediately = ref(false);
const displayText = computed(() => {
    if (props.infoText && props.infoText.trim().length > 0) {
        return props.infoText;
    }
    return languageStore.t('general.voiceDialogInfo');
});

const dialogBinding = computed({
    get: () => Boolean(dialogStore.dialogs[props.dialogKey]) && (isRecording.value || isProcessing.value || !!errorMessage.value),
    set: (value) => {
        if (!value) {
            cancelRecording();
        }
    },
});

watch(
    () => dialogStore.dialogs[props.dialogKey],
    async (isOpen) => {
        if (isOpen) {
            await startRecording();
        } else {
            resetState();
        }
    }
);

const startRecording = async () => {
    errorMessage.value = '';
    shouldProcessRecording.value = false;
    sendImmediately.value = false;
    isInitializing.value = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        audioChunks.value = [];
        recorder.ondataavailable = (event) => {
            if (event.data?.size) {
                audioChunks.value.push(event.data);
            }
        };
        recorder.onstop = handleRecorderStop;

        recorder.start();
        mediaRecorder.value = recorder;
        isRecording.value = true;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        errorMessage.value = languageStore.t('general.errorOccurred');
        emit('error', error);
    } finally {
        isInitializing.value = false;
    }
};

const handleRecorderStop = async () => {
    isRecording.value = false;
    const blob = new Blob(audioChunks.value, { type: 'audio/wav' });
    audioChunks.value = [];

    if (!shouldProcessRecording.value) {
        cleanupRecorder();
        return;
    }

    isProcessing.value = props.mode === 'transcribe';

    try {
        const payload = { audioBlob: blob };

        if (props.mode === 'transcribe') {
            const text = await apiStore.transcribeAudio(blob);
            if (!text) {
                throw new Error('TRANSCRIPTION_FAILED');
            }
            payload.text = text;
        }

        if (sendImmediately.value) {
            emit('send', payload);
        } else {
            emit('completed', payload);
        }

        if (props.autoCloseOnComplete) {
            dialogStore.closeDialog(props.dialogKey);
        }
    } catch (error) {
        console.error('Error handling recording:', error);
        errorMessage.value = languageStore.t('general.errorOccurred');
        emit('error', error);
    } finally {
        isProcessing.value = false;
        shouldProcessRecording.value = false;
        sendImmediately.value = false;
        cleanupRecorder();
    }
};

const cancelRecording = () => {
    shouldProcessRecording.value = false;
    sendImmediately.value = false;
    stopRecorder();
    dialogStore.closeDialog(props.dialogKey);
    emit('cancelled');
};

const stopAndProcess = (send = false) => {
    if (!mediaRecorder.value || !isRecording.value) {
        return;
    }
    shouldProcessRecording.value = true;
    sendImmediately.value = send;
    stopRecorder();
};

const stopRecorder = () => {
    if (!mediaRecorder.value) {
        return;
    }
    try {
        if (mediaRecorder.value.state !== 'inactive') {
            mediaRecorder.value.stop();
        }
    } catch (error) {
        console.warn('Failed to stop media recorder gracefully:', error);
    }
    mediaRecorder.value.stream?.getTracks().forEach((track) => track.stop());
};

const cleanupRecorder = () => {
    mediaRecorder.value = null;
};

const resetState = () => {
    errorMessage.value = '';
    isRecording.value = false;
    isProcessing.value = false;
    shouldProcessRecording.value = false;
    audioChunks.value = [];
    if (mediaRecorder.value) {
        try {
            if (mediaRecorder.value.state !== 'inactive') {
                mediaRecorder.value.stop();
            }
        } catch (error) {
            // ignore cleanup errors
        }
        mediaRecorder.value.stream?.getTracks().forEach((track) => track.stop());
    }
    cleanupRecorder();
};

onUnmounted(() => {
    resetState();
});
</script>
