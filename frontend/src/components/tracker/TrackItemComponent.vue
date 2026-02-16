<template>
    <VoiceInputDialog dialog-key="trackVoiceDialog" mode="audio" @completed="handleVoiceRecording" />
    <TrackImageDialog @images-selected="handleImagesSelected" />
    <div class="w-100 mx-5 mt-5">
        <v-form @submit.prevent="submitEntry()">
            <v-text-field v-model="newItem" :label="languageStore.t('tracker.trackNewItem')" outlined density="compact"
                bg-color="white" ref="newItemField" :loading="trackerStore.isAddingItem">
                <template v-slot:append-inner>
                    <v-badge :model-value="selectedImages.length > 0" :content="selectedImages.length.toString()"
                        color="success" location="top right" offset-y="-8" offset-x="-8" class="mr-4">
                        <v-icon @click="openImageDialog"
                            :color="selectedImages.length > 0 ? 'success' : ''">mdi-image</v-icon>
                    </v-badge>
                    <v-badge :model-value="!!selectedAudio" dot color="success" location="top right" offset-y="-8"
                        offset-x="-8" class="mr-2">
                        <v-icon @click="openVoiceDialog" :color="selectedAudio ? 'success' : ''">mdi-microphone</v-icon>
                    </v-badge>
                    <v-btn v-if="canSubmit" icon="mdi-send" size="small" color="primary" variant="text"
                        @click="submitEntry" :loading="trackerStore.isAddingItem" class="ml-2">
                    </v-btn>
                </template>
            </v-text-field>
        </v-form>
        <div v-if="selectedImages.length > 0 || selectedAudio" class="selected-media-preview mb-2">
            <v-chip v-if="selectedImages.length > 0" size="small" color="success" closable class="mr-2"
                @click:close="clearImages">
                <v-icon start size="small">mdi-image</v-icon>
                {{ selectedImages.length }} {{ languageStore.t(selectedImages.length === 1 ? 'tracker.imageSelected' :
                    'tracker.imagesSelected') }}
            </v-chip>
            <v-chip v-if="selectedAudio" size="small" color="success" closable @click:close="clearAudio">
                <v-icon start size="small">mdi-microphone</v-icon>
                {{ languageStore.t('tracker.audioRecorded') }}
            </v-chip>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTrackerStore } from '@/stores/trackerStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useDialogStore } from '@/stores/dialogStore';
import VoiceInputDialog from '@/components/dialogs/VoiceInputDialog.vue';
import TrackImageDialog from '@/components/dialogs/TrackImageDialog.vue';

const trackerStore = useTrackerStore();
const languageStore = useLanguageStore();
const dialogStore = useDialogStore();

const newItem = ref('');
const newItemField = ref(null);
const selectedImages = ref([]);
const selectedAudio = ref(null);

const canSubmit = computed(() => {
    return selectedImages.value.length > 0 || selectedAudio.value !== null;
});

const submitEntry = async () => {
    const trimmedItem = newItem.value.trim();

    // Prüfe ob wir Daten zum Senden haben (Text, Bilder oder Audio)
    const hasContent = trimmedItem !== '' || selectedImages.value.length > 0 || selectedAudio.value;

    if (!hasContent) {
        return;
    }

    // Kombinierter Upload je nach verfügbaren Medien
    if (selectedImages.value.length > 0 || selectedAudio.value) {
        // Multimodaler Upload
        await trackerStore.trackFoodMultimodal({
            text: trimmedItem || null,
            images: selectedImages.value,
            audio: selectedAudio.value
        });
    } else {
        // Nur Text
        await trackerStore.trackFoodByText(trimmedItem);
    }

    // Reset
    newItem.value = '';
    selectedImages.value = [];
    selectedAudio.value = null;
};

const openVoiceDialog = () => {
    dialogStore.openDialog('trackVoiceDialog');
};

const openImageDialog = () => {
    dialogStore.openDialog('trackImageDialog');
};

const handleVoiceRecording = async ({ audioBlob }) => {
    if (audioBlob) {
        selectedAudio.value = audioBlob;
        dialogStore.closeDialog('trackVoiceDialog');
    }
};

const handleImagesSelected = (images) => {
    selectedImages.value = images;
};

const clearImages = () => {
    selectedImages.value = [];
};

const clearAudio = () => {
    selectedAudio.value = null;
};
</script>

<style scoped>
.selected-media-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
</style>
