<template>
    <VoiceInputDialog dialog-key="recipeVoiceDialog" mode="audio" @completed="handleVoiceRecording" />
    <TrackImageDialog :initial-images="selectedImages" @images-selected="handleImagesSelected" />
    
    <v-dialog v-model="dialogStore.dialogs.userRecipeDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('recipes.createRecipeDialog.title') }}</v-card-title>
            <v-card-text>
                <!-- Multimodal Input wie beim Tracker -->
                <v-form @submit.prevent="createRecipe()">
                    <v-textarea 
                        v-model="prompt" 
                        :label="languageStore.t('recipes.createRecipeDialog.label')" 
                        auto-grow
                        rows="3" 
                        class="mt-4" 
                        clearable
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
                                @click="createRecipe" :loading="isGenerating" class="ml-2">
                            </v-btn>
                        </template>
                    </v-textarea>
                </v-form>

                <!-- Bildervorschau (optional, falls im Textarea nicht ersichtlich) -->
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

                <div class="py-5">
                    <v-expansion-panels>
                        <v-expansion-panel :title="languageStore.t('general.instructions')">
                            <v-expansion-panel-text>
                                <p v-html="languageStore.t('recipes.createRecipeDialog.text')"> </p>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="closeSheet">{{ languageStore.t('general.close') }}</v-btn>
                <v-btn color="primary" @click="createRecipe" :disabled="isGenerating || !canSubmit">
                    {{ languageStore.t('general.generate') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLanguageStore } from '@/stores/languageStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { useDialogStore } from '@/stores/dialogStore';
import VoiceInputDialog from '@/components/dialogs/VoiceInputDialog.vue';
import TrackImageDialog from '@/components/dialogs/TrackImageDialog.vue';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();

const isGenerating = computed(() => recipeStore.generationStatus === 'processing');

const prompt = ref('');
const selectedImages = ref([]);
const selectedAudio = ref(null);

// Prüfen ob wir etwas zum Senden haben
const canSubmit = computed(() => {
    const hasText = prompt.value.trim() !== '';
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
        dialogStore.openDialog('recipeVoiceDialog');
    }
};

const handleVoiceRecording = ({ audioBlob }) => {
    if (audioBlob) {
        selectedAudio.value = audioBlob;
        dialogStore.closeDialog('recipeVoiceDialog');
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

// Generate recipe with multimodal input
const createRecipe = async () => {
    if (isGenerating.value) {
        alert(languageStore.t('recipes.processingMessage'));
        return;
    }
    
    const hasContent = prompt.value.trim() !== '' || selectedImages.value.length > 0 || selectedAudio.value;
    if (!hasContent) return;

    try {
        let result;
        
        // Multimodaler Upload wenn Bilder oder Audio vorhanden
        if (selectedImages.value.length > 0 || selectedAudio.value) {
            result = await recipeStore.createUserRecipeMultimodal({
                text: prompt.value.trim() || null,
                images: selectedImages.value,
                audio: selectedAudio.value
            });
        } else {
            // Nur Text
            result = await recipeStore.createUserRecipe(prompt.value.trim());
        }
        
        dialogStore.closeDialog('userRecipeDialog');
        if (result && result.status === 'processing') {
            alert(languageStore.t('recipes.processingMessage'));
        } else if (result) {
            await recipeStore.fetchUserRecipes();
            alert(languageStore.t('recipes.readyMessage'));
        }
    } catch (error) {
        console.error('Recipe generation failed:', error);
    } finally {
        resetForm();
    }
};

const resetForm = () => {
    prompt.value = '';
    selectedImages.value = [];
    selectedAudio.value = null;
};

// Close the dialog
const closeSheet = () => {
    dialogStore.closeDialog('userRecipeDialog');
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
