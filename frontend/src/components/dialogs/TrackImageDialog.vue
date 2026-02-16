<template>
    <v-dialog v-model="dialogBinding" max-width="600">
        <v-card>
            <v-card-title>{{ languageStore.t('tracker.addImage') }}</v-card-title>
            <v-card-text>
                <v-textarea v-if="showDescription" class="my-3" v-model="description"
                    :label="languageStore.t('tracker.descriptionLabel')"
                    :placeholder="languageStore.t('tracker.descriptionPlaceholder')" dense rows="2"></v-textarea>

                <!-- Bildervorschau -->
                <div v-if="selectedImages.length > 0" class="image-preview-grid mb-4">
                    <div v-for="(image, index) in selectedImages" :key="index" class="image-preview-item">
                        <v-img :src="image.preview" class="preview-image" cover>
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

                <div class="text-center">
                    <p class="pb-3">
                        <v-btn color="primary" prepend-icon="mdi-camera" @click="triggerCapture">
                            {{ languageStore.t('general.capturePhoto') }}
                        </v-btn>
                        <input type="file" accept="image/*" ref="fileCapture" class="d-none" capture="environment"
                            multiple @change="handleFileInput" />
                    </p>
                    <p>
                        <v-btn color="primary" prepend-icon="mdi-image-multiple" @click="triggerFileInput">
                            {{ languageStore.t('general.selectPhoto') }}
                        </v-btn>
                        <input type="file" accept="image/*" ref="fileInput" class="d-none" multiple
                            @change="handleFileInput" />
                    </p>
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeDialog">{{ languageStore.t('general.cancel') }}</v-btn>
                <v-btn color="primary" @click="confirmSelection" :disabled="selectedImages.length === 0">
                    {{ languageStore.t('general.confirm') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';

const props = defineProps({
    showDescription: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['images-selected']);

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();

const description = ref('');
const selectedImages = ref([]);
const fileInput = ref(null);
const fileCapture = ref(null);

const dialogBinding = computed({
    get: () => Boolean(dialogStore.dialogs.trackImageDialog),
    set: (value) => {
        if (value) {
            dialogStore.openDialog('trackImageDialog');
        } else {
            dialogStore.closeDialog('trackImageDialog');
        }
    }
});

const triggerFileInput = () => {
    fileInput.value.click();
};

const triggerCapture = () => {
    fileCapture.value.click();
};

const handleFileInput = (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                selectedImages.value.push({
                    file: file,
                    preview: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    });

    event.target.value = null;
};

const removeImage = (index) => {
    selectedImages.value.splice(index, 1);
};

const closeDialog = () => {
    dialogStore.closeDialog('trackImageDialog');
    resetState();
};

const confirmSelection = () => {
    const imageFiles = selectedImages.value.map(img => img.file);
    emit('images-selected', imageFiles);
    closeDialog();
};

const resetState = () => {
    selectedImages.value = [];
    description.value = '';
};
</script>

<style scoped>
.d-none {
    display: none;
}

.image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
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
