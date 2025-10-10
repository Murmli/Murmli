<template>
  <v-dialog v-model="dialogStore.dialogs.editRecipeDialog" fullscreen>
    <v-card>
      <v-toolbar color="primary" class="pt-5">
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>{{ languageStore.t('recipe.editDialog.title') }}</v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-textarea
          class="mt-6"
          v-model="text"
          :label="languageStore.t('recipe.editDialog.instructions')"
          outlined
          rows="5"
          auto-grow
        />
        <v-alert v-if="errorMessage" type="error" class="mt-2">
          {{ errorMessage }}
        </v-alert>
        <v-btn color="primary" block :loading="loading" class="mt-4" @click="generatePreview">
          {{ languageStore.t('recipe.editDialog.preview') }}
        </v-btn>
        <v-card v-if="previewData" class="mt-6" outlined>
          <v-card-title class="text-h6">
            {{ languageStore.t('recipe.editDialog.changes') }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="(change, idx) in previewData.changes"
                :key="idx"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-check-circle-outline</v-icon>
                </template>
                <v-list-item-title class="change-item">{{ change }}</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-divider class="my-3" />
            <div class="text-center">
              <h3 class="mb-2">{{ previewData.preview.title }}</h3>
              <p>{{ previewData.preview.descriptionShort }}</p>
            </div>
          </v-card-text>
        </v-card>
        <v-btn v-if="previewData" color="primary" block :loading="loading" class="mt-4" @click="applyEdit">
          {{ languageStore.t('recipe.editDialog.save') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useDialogStore } from '@/stores/dialogStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useRecipeStore } from '@/stores/recipeStore';

const dialogStore = useDialogStore();
const languageStore = useLanguageStore();
const recipeStore = useRecipeStore();

const text = ref('');
const previewData = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const generatePreview = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const editFn = recipeStore.currentRecipeType === 2
      ? recipeStore.editUserRecipe
      : recipeStore.editRecipe;
    const result = await editFn(
      recipeStore.currentRecipe._id,
      text.value,
      true
    );
    previewData.value = result;
  } catch (error) {
    errorMessage.value = languageStore.t('recipe.editDialog.error');
  } finally {
    loading.value = false;
  }
};

const applyEdit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (previewData.value) {
      const editFn = recipeStore.currentRecipeType === 2
        ? recipeStore.editUserRecipe
        : recipeStore.editRecipe;
      await editFn(
        recipeStore.currentRecipe._id,
        '',
        false,
        previewData.value.preview
      );
    }
    closeDialog();
  } catch (error) {
    errorMessage.value = languageStore.t('recipe.editDialog.error');
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  dialogStore.closeDialog('editRecipeDialog');
  previewData.value = null;
  text.value = '';
};
</script>

<style scoped>
.change-item {
  white-space: pre-line;
  overflow: visible;
  text-overflow: unset;
}
</style>
