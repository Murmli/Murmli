<template>
    <v-dialog v-model="dialogStore.dialogs.trackImageDialog" max-width="500">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.addImage') }}</v-card-title>
            <v-card-text>
                <v-textarea class="my-3" v-model="description" :label="languageStore.t('tracker.descriptionLabel')"
                    :placeholder="languageStore.t('tracker.descriptionPlaceholder')" dense></v-textarea>
                <div class="text-center">
                    <v-img v-if="image" :src="image" class="my-4" max-height="200"></v-img>

                    <p class="pb-3">
                        <v-btn color="primary" @click="triggerCapture">{{
                            languageStore.t('general.capturePhoto')
                            }}</v-btn>
                        <input type="file" accept="image/*" ref="fileCapture" class="d-none" capture="environment"
                            @change="handleFileInput" />
                    </p>
                    <p>
                        <v-btn color="primary" @click="triggerFileInput">{{
                            languageStore.t('general.selectPhoto')
                            }}</v-btn>
                        <input type="file" accept="image/*" ref="fileInput" class="d-none" @change="handleFileInput" />
                    </p>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="submitImage">{{ languageStore.t('general.send') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTrackerStore } from '@/stores/trackerStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const trackerStore = useTrackerStore();

const description = ref('');
const image = ref(null); // Für die Vorschau (Data URL)
const selectedFileObject = ref(null); // Für das eigentliche File-Objekt
const fileInput = ref(null);
const fileCapture = ref(null);

// Trigger the file input for gallery selection
const triggerFileInput = () => {
    fileInput.value.click();
};

// Trigger the file input for camera capture
const triggerCapture = () => {
    fileCapture.value.click();
};

// Handle file input change (from gallery or camera)
const handleFileInput = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFileObject.value = file; // Store the File object
        const reader = new FileReader();
        reader.onload = () => {
            image.value = reader.result; // Store the Data URL for preview
        };
        reader.readAsDataURL(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = null;
};


function closeDialog() {
    dialogStore.closeDialog('trackImageDialog');
    image.value = null;
    selectedFileObject.value = null;
    description.value = '';
}

async function submitImage() {
    if (!selectedFileObject.value) {
        // Optional: Fehlermeldung anzeigen
        console.warn('Kein Bild ausgewählt');
        return;
    }

    const file = selectedFileObject.value;
    const desc = description.value.trim();

    try {
        await trackerStore.trackFoodByImage(file, desc);
        closeDialog();
    } catch (error) {
        console.error('Fehler beim Hochladen des Bildes:', error);
        // Optional: Fehlermeldung für den Benutzer anzeigen
    }
}
</script>

<style scoped>
.d-none {
    display: none;
}
</style>
