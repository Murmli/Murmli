<template>
    <VoiceInputDialog dialog-key="trackVoiceDialog" mode="audio"
        @completed="handleVoiceRecording" />
    <TrackImageDialog />
    <div class="w-100 mx-5 mt-5">
        <v-form @submit.prevent="addItem()">
            <v-text-field v-model="newItem" :label="languageStore.t('tracker.trackNewItem')" outlined density="compact"
                bg-color="white" ref="newItemField" :loading="trackerStore.isAddingItem">
                <template v-slot:append-inner>
                    <v-icon @click="openImageDialog" class="mr-2">mdi-image</v-icon>
                    <v-icon @click="openVoiceDialog">mdi-microphone</v-icon>
                </template>
            </v-text-field>
        </v-form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
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

const addItem = async () => {
    const trimmedItem = newItem.value.trim();
    if (trimmedItem !== '') {
        trackerStore.trackFoodByText(trimmedItem);
        newItem.value = '';
    }
};

const openVoiceDialog = () => {
    dialogStore.openDialog('trackVoiceDialog');
};

const openImageDialog = () => {
    dialogStore.openDialog('trackImageDialog');
};

const handleVoiceRecording = async ({ audioBlob }) => {
    if (audioBlob) {
        await trackerStore.trackFoodByAudio(audioBlob);
        dialogStore.closeDialog('trackVoiceDialog');
    }
};
</script>
