<template>
    <v-btn color="primary" @click="triggerFileInput">
        {{ languageStore.t("settings.import") }}
    </v-btn>

    <input ref="fileInput" type="file" accept="application/json" style="display: none" @change="handleFileUpload" />
</template>

<script setup>
import { ref } from "vue";
import { useLanguageStore } from "@/stores/languageStore";
import { useUserStore } from "@/stores/userStore";
import { useDialogStore } from "@/stores/dialogStore";

const languageStore = useLanguageStore();
const userStore = useUserStore();
const dialogStore = useDialogStore();
const fileInput = ref(null);
const dialog = ref(false);
const selectedFile = ref(null);

// Triggers the hidden file input
const triggerFileInput = () => {
    fileInput.value.click();
};

// Handles file selection and triggers import
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedFile.value = file;
        dialogStore.openConfirmDialog(
            languageStore.t("settings.importWarningTitle"),
            languageStore.t("settings.importWarningText"),
            confirmImport,
        );
    }
    // Reset input field to allow re-selection of the same file
    event.target.value = "";
};

// Confirms import and proceeds with importing user data
const confirmImport = async () => {
    if (selectedFile.value) {
        await userStore.importUserData(selectedFile.value);
        dialog.value = false; // Close dialog after import
    }
};
</script>
