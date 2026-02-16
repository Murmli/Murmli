<template>
    <VoiceInputDialog dialog-key="trainingPlanVoiceDialog" mode="audio" @completed="handleVoiceRecording" />
    <TrackImageDialog :initial-images="selectedImages" @images-selected="handleImagesSelected" />
    
    <v-dialog v-model="dialogStore.dialogs.createTrainingPlanDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('trainingPlans.help.step1.title') }}</v-card-title>
            <v-card-text>
                <v-form @submit.prevent="confirm()">
                    <v-textarea 
                        v-model="planDescription" 
                        clearable
                        :label="languageStore.t('trainingPlans.descriptionLabelCreate')"
                        auto-grow
                        rows="3"
                        :loading="isGenerating"
                    >
                        <template #append-inner>
                            <v-badge :model-value="selectedImages.length > 0" :content="selectedImages.length.toString()"
                                color="success" location="top right" offset-y="-8" offset-x="-8" class="mr-4">
                                <v-icon @click="handleImageClick"
                                    :color="selectedImages.length > 0 ? 'success' : ''">mdi-image</v-icon>
                            </v-badge>
                            <v-badge :model-value="!!selectedAudio" dot color="success" location="top right" offset-y="-8"
                                offset-x="-8" class="mr-2">
                                <v-icon @click="handleMicrophoneClick" :color="selectedAudio ? 'success' : ''">mdi-microphone</v-icon>
                            </v-badge>
                            <v-btn v-if="canSubmit" icon="mdi-send" size="small" color="primary" variant="text"
                                @click="confirm" :loading="isGenerating" class="ml-2">
                            </v-btn>
                        </template>
                    </v-textarea>
                </v-form>

                <!-- Bildervorschau -->
                <div v-if="selectedImages.length > 0" class="image-preview-grid mt-2 mb-4">
                    <div v-for="(image, index) in selectedImages" :key="index" class="image-preview-item">
                        <v-img :src="getImagePreview(image)" class="preview-image" cover max-height="80">
                            <template v-slot:placeholder>
                                <v-row align="center" class="fill-height ma-0" justify="center">
                                    <v-progress-circular color="primary" indeterminate size="24"></v-progress-circular>
                                </v-row>
                            </template>
                        </v-img>
                        <v-btn icon="mdi-close" size="x-small" color="error" class="remove-image-btn"
                            @click="removeImage(index)"></v-btn>
                    </div>
                </div>

                <!-- Audio-Status-Anzeige -->
                <v-alert v-if="selectedAudio" type="info" density="compact" class="mb-4" closable @click:close="selectedAudio = null">
                    <div class="d-flex align-center">
                        <span>{{ languageStore.t('tracker.audioRecorded') }}</span>
                        <v-spacer></v-spacer>
                    </div>
                </v-alert>

                <div>
                    <v-expansion-panels>
                        <v-expansion-panel :title="languageStore.t('general.instructions')">
                            <v-expansion-panel-text>
                                <p v-html="languageStore.t('trainingPlans.createPlanInstructions')"> </p>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="confirm" :disabled="isGenerating || !canSubmit">
                    {{ languageStore.t('general.confirm') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTrainingStore } from '@/stores/trainingStore';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import VoiceInputDialog from '@/components/dialogs/VoiceInputDialog.vue';
import TrackImageDialog from '@/components/dialogs/TrackImageDialog.vue';

const dialogStore = useDialogStore();
const trainingStore = useTrainingStore();
const languageStore = useLanguageStore();

const planDescription = ref('');
const selectedImages = ref([]);
const selectedAudio = ref(null);
const isGenerating = computed(() => trainingStore.generationStatus === 'processing');

// Prüfen ob wir etwas zum Senden haben
const canSubmit = computed(() => {
    const hasText = planDescription.value.trim() !== '';
    const hasImages = selectedImages.value.length > 0;
    const hasAudio = selectedAudio.value !== null;
    return hasText || hasImages || hasAudio;
});

const handleImageClick = () => {
    dialogStore.openDialog('trackImageDialog');
};

const handleMicrophoneClick = () => {
    if (selectedAudio.value) {
        selectedAudio.value = null;
    } else {
        dialogStore.openDialog('trainingPlanVoiceDialog');
    }
};

const handleVoiceRecording = ({ audioBlob }) => {
    if (audioBlob) {
        selectedAudio.value = audioBlob;
        dialogStore.closeDialog('trainingPlanVoiceDialog');
    }
};

const handleImagesSelected = (images) => {
    selectedImages.value = images;
};

const getImagePreview = (image) => {
    if (image instanceof File) {
        return URL.createObjectURL(image);
    }
    return image;
};

const removeImage = (index) => {
    selectedImages.value.splice(index, 1);
};

const confirm = async () => {
    if (isGenerating.value) {
        alert(languageStore.t('trainingPlans.processingMessage'));
        return;
    }
    
    const hasContent = planDescription.value.trim() !== '' || selectedImages.value.length > 0 || selectedAudio.value;
    if (!hasContent) return;

    try {
        let result;
        
        // Multimodaler Upload wenn Bilder oder Audio vorhanden
        if (selectedImages.value.length > 0 || selectedAudio.value) {
            result = await trainingStore.generateTrainingPlanMultimodal({
                text: planDescription.value.trim() || null,
                images: selectedImages.value,
                audio: selectedAudio.value
            });
        } else {
            // Nur Text
            result = await trainingStore.generateTrainingPlan(planDescription.value);
        }
        
        dialogStore.closeDialog('createTrainingPlanDialog');
        if (result && result.status === 'processing') {
            alert(languageStore.t('trainingPlans.processingMessage'));
        } else if (result) {
            await trainingStore.fetchTrainingPlans();
            alert(languageStore.t('trainingPlans.readyMessage'));
        }
    } catch (error) {
        console.error('Training plan generation failed:', error);
    } finally {
        resetForm();
    }
};

const resetForm = () => {
    planDescription.value = '';
    selectedImages.value = [];
    selectedAudio.value = null;
};

const closeDialog = () => {
    dialogStore.closeDialog('createTrainingPlanDialog');
    // Reset state for next time
    setTimeout(() => {
        resetForm();
    }, 300);
};
</script>

<style scoped>
.d-none {
    display: none;
}

.image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
}

.image-preview-item {
    position: relative;
    aspect-ratio: 1;
}

.preview-image {
    width: 100%;
    height: 100%;
    border-radius: 8px;
}

.remove-image-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 1;
}
</style>
