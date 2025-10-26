<template>
    <VoiceInputDialog dialog-key="recipeVoiceDialog" mode="transcribe" @completed="applyVoiceInput" />
    <v-dialog v-model="dialogStore.dialogs.userRecipeDialog">
        <v-card>
            <v-card-title>{{ languageStore.t('recipes.createRecipeDialog.title') }}</v-card-title>
            <v-card-text>
                <v-textarea v-model="prompt" :label="languageStore.t('recipes.createRecipeDialog.label')" auto-grow
                    rows="3" class="mt-4" clearable>
                    <template #append-inner>
                        <v-icon @click="openVoiceDialog">mdi-microphone</v-icon>
                    </template>
                </v-textarea>
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
                <v-btn color="primary" @click="createRecipe" :disabled="isGenerating">{{
                    languageStore.t('general.generate') }}</v-btn>
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

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();

const isGenerating = computed(() => recipeStore.generationStatus === 'processing');

const prompt = ref('');
const image = ref(null);
const fileInput = ref(null);
const fileCapture = ref(null);

const openVoiceDialog = () => {
    dialogStore.openDialog('recipeVoiceDialog');
};

const applyVoiceInput = ({ text }) => {
    if (!text) {
        return;
    }
    prompt.value = prompt.value
        ? `${prompt.value.trimEnd()}\n${text}`
        : text;
};

// Trigger the file input for camera or gallery selection
const triggerFileInput = () => {
    fileInput.value.click();
};

const triggerCapture = () => {
    fileCapture.value.click();
};

// Handle file input change
const handleFileInput = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            image.value = reader.result;
        };
        reader.readAsDataURL(file);
    }
};

// Generate recipe with prompt and image
const createRecipe = async () => {
    if (isGenerating.value) {
        alert(languageStore.t('recipes.processingMessage'));
        return;
    }
    if (!prompt.value.trim()) return;

    try {
        const result = await recipeStore.createUserRecipe(prompt.value, image.value);
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
        prompt.value = '';
        image.value = null;
    }
};

// Close the dialog
const closeSheet = () => {
    dialogStore.closeDialog('userRecipeDialog');
    // Reset state for next time
    setTimeout(() => {
        prompt.value = '';
        image.value = null;
    }, 300);
};
</script>

<style scoped>
.d-none {
    display: none;
}
</style>
